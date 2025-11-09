#!/usr/bin/env node

/**
 * NEC++ WASM Command-Line Tool
 *
 * This tool processes NEC antenna modeling files using the WebAssembly port
 * of NEC++. It produces output compatible with the C++ version for testing.
 *
 * Usage: node nec_wasm.js -i input.nec -o output.out
 */

const fs = require('fs');
const path = require('path');

// Parse command-line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        input: null,
        output: null
    };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '-i' && i + 1 < args.length) {
            options.input = args[i + 1];
            i++;
        } else if (args[i] === '-o' && i + 1 < args.length) {
            options.output = args[i + 1];
            i++;
        } else if (args[i] === '-h' || args[i] === '--help') {
            console.log('Usage: node nec_wasm.js -i input.nec -o output.out');
            console.log('  -i  Input NEC file');
            console.log('  -o  Output file');
            process.exit(0);
        }
    }

    if (!options.input) {
        console.error('Error: Input file (-i) is required');
        process.exit(1);
    }

    if (!options.output) {
        // Default output filename
        options.output = options.input.replace(/\.nec$/, '.outwasm');
    }

    return options;
}

// Parse a NEC card line
function parseCard(line) {
    if (!line || line.length < 2) return null;

    const card = line.substring(0, 2).toUpperCase();
    const rest = line.substring(2).trim();

    // Parse all parameters as strings first
    const params = rest.split(/[\s,]+/).filter(p => p.length > 0);

    const ints = [];
    const floats = [];
    const allParams = [];

    // Convert to numbers
    for (const p of params) {
        const num = parseFloat(p);
        allParams.push(isNaN(num) ? 0 : num);
    }

    // First 4 are integers, rest are floats
    for (let i = 0; i < Math.max(4, allParams.length); i++) {
        if (i < 4) {
            ints.push(i < allParams.length ? Math.floor(allParams[i]) : 0);
        }
    }

    for (let i = 4; i < Math.max(10, allParams.length); i++) {
        floats.push(i < allParams.length ? allParams[i] : 0.0);
    }

    // Pad with zeros
    while (ints.length < 4) ints.push(0);
    while (floats.length < 6) floats.push(0.0);

    return {
        card: card,
        i1: ints[0],
        i2: ints[1],
        i3: ints[2],
        i4: ints[3],
        f1: floats[0],
        f2: floats[1],
        f3: floats[2],
        f4: floats[3],
        f5: floats[4],
        f6: floats[5],
        allParams: allParams,
        line: line
    };
}

// Read and parse NEC file
function parseNecFile(filename) {
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');

    const cards = {
        comments: [],
        geometry: [],
        program: []
    };

    let inComments = false;
    let inGeometry = true;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const cardType = trimmed.substring(0, 2).toUpperCase();

        // Handle comments
        if (cardType === 'CM') {
            inComments = true;
            cards.comments.push(trimmed.substring(2));
            continue;
        }

        if (cardType === 'CE') {
            inComments = false;
            cards.comments.push(trimmed.substring(2));
            continue;
        }

        if (inComments) {
            cards.comments.push(trimmed);
            continue;
        }

        const card = parseCard(trimmed);
        if (!card) continue;

        // Add card to appropriate section (GE should be in geometry)
        if (inGeometry) {
            cards.geometry.push(card);
        } else {
            cards.program.push(card);
        }

        // GE marks the end of geometry (check AFTER adding the card)
        if (cardType === 'GE') {
            inGeometry = false;
        }
    }

    return cards;
}

// Format output to match NEC++ format
class OutputFormatter {
    constructor() {
        this.lines = [];
        this.indent = 0;
    }

    line(text = '') {
        this.lines.push(' '.repeat(this.indent) + text);
    }

    section(title) {
        this.line();
        this.line('='.repeat(70));
        this.line(title);
        this.line('='.repeat(70));
    }

    header() {
        this.line(' __________________________________________');
        this.line('|                                          |');
        this.line('| NUMERICAL ELECTROMAGNETICS CODE (WASM)  |');
        this.line('| WebAssembly Port                        |');
        this.line('|__________________________________________|');
        this.line();
    }

    getOutput() {
        return this.lines.join('\n');
    }
}

// Process NEC file with WASM module
async function processNecFile(inputFile, outputFile) {
    const scriptDir = __dirname;
    const createNecppModule = require(path.join(scriptDir, 'necpp.js'));

    const output = new OutputFormatter();
    output.header();

    // Parse NEC file
    const cards = parseNecFile(inputFile);

    // Print comments
    if (cards.comments.length > 0) {
        output.section('COMMENTS');
        for (const comment of cards.comments) {
            output.line(comment);
        }
    }

    // Load WASM module
    const Module = await createNecppModule();
    const nec = new Module.NecppWrapper();

    try {
        // Check for errors after initialization
        let errorMsg = nec.getErrorMessage();
        if (errorMsg && errorMsg.length > 0) {
            throw new Error(`Initialization error: ${errorMsg}`);
        }

        // Process geometry cards
        output.section('GEOMETRY');
        for (const card of cards.geometry) {
            output.line(`${card.card} ${card.i1} ${card.i2} ${card.i3} ${card.i4} ${card.f1} ${card.f2} ${card.f3} ${card.f4} ${card.f5} ${card.f6}`);

            switch (card.card) {
                case 'GW': // Wire
                    // GW tag segments x1 y1 z1 x2 y2 z2 radius
                    // All 9 parameters should be in the floats, but the tag and segments are in ints
                    // Actually: i1=tag, i2=segments, f1-f6 are x1,y1,z1,x2,y2,z2
                    // We need to get radius from the next float or default
                    // Reading the card format: GW tag segs x1 y1 z1 x2 y2 z2 rad
                    // So we have: i1=tag, i2=segs, f1=x1, f2=y1, f3=z1, f4=x2, f5=y2, f6=z2
                    // But radius is missing! Need to parse 9 params total
                    // Let me reparse the line to get all 9 parameters
                    const parts = card.line.substring(2).trim().split(/[\s,]+/).filter(p => p.length > 0);
                    const tag = parseInt(parts[0]) || 0;
                    const segs = parseInt(parts[1]) || 0;
                    const x1 = parseFloat(parts[2]) || 0;
                    const y1 = parseFloat(parts[3]) || 0;
                    const z1 = parseFloat(parts[4]) || 0;
                    const x2 = parseFloat(parts[5]) || 0;
                    const y2 = parseFloat(parts[6]) || 0;
                    const z2 = parseFloat(parts[7]) || 0;
                    const rad = parseFloat(parts[8]) || 0.001;
                    nec.wire(tag, segs, x1, y1, z1, x2, y2, z2, rad, 1.0, 1.0);
                    break;

                case 'SP': // Surface patch
                    nec.spCard(card.i1, card.f1, card.f2, card.f3, card.f4, card.f5, card.f6);
                    break;

                case 'GX': // Reflection
                    nec.gxCard(card.i1, card.i2);
                    break;

                case 'GE': // Geometry complete
                    nec.geometryComplete(card.i1);
                    output.line('Geometry complete');
                    break;

                case 'GM': // Geometry move
                    nec.gmCard(card.i1, card.i2, card.f1, card.f2, card.f3, card.f4, card.f5, card.f6, card.i3);
                    break;

                case 'SC': // Surface continuation
                    nec.scCard(card.i1, card.f1, card.f2, card.f3, card.f4, card.f5, card.f6);
                    break;
            }
        }

        // Process program cards
        output.section('PROGRAM CARDS');

        let freqIndex = 0;
        let hasFrequency = false;

        for (const card of cards.program) {
            output.line(`${card.card} ${card.i1} ${card.i2} ${card.i3} ${card.i4} ${card.f1.toExponential(5)} ${card.f2.toExponential(5)} ${card.f3.toExponential(5)} ${card.f4.toExponential(5)} ${card.f5.toExponential(5)} ${card.f6.toExponential(5)}`);

            switch (card.card) {
                case 'FR': // Frequency
                    nec.frCard(card.i1, card.i2, card.f1, card.f2);
                    hasFrequency = true;
                    break;

                case 'GN': // Ground
                    nec.gnCard(card.i1, card.i2, card.f1, card.f2, card.f3, card.f4, card.f5, card.f6);
                    break;

                case 'EX': // Excitation
                    nec.exCard(card.i1, card.i2, card.i3, card.i4, card.f1, card.f2, card.f3, card.f4, card.f5, card.f6);
                    break;

                case 'LD': // Loading
                    nec.ldCard(card.i1, card.i2, card.i3, card.i4, card.f1, card.f2, card.f3);
                    break;

                case 'TL': // Transmission line
                    nec.tlCard(card.i1, card.i2, card.i3, card.i4, card.f1, card.f2, card.f3, card.f4, card.f5, card.f6);
                    break;

                case 'NT': // Network
                    nec.ntCard(card.i1, card.i2, card.i3, card.i4, card.f1, card.f2, card.f3, card.f4, card.f5, card.f6);
                    break;

                case 'EK': // Extended kernel
                    nec.ekCard(card.i1);
                    break;

                case 'KH': // Kernel handling
                    nec.khCard(card.f1);
                    break;

                case 'GD': // Ground description
                    nec.gdCard(card.f1, card.f2, card.f3, card.f4);
                    break;

                case 'MP': // Medium parameters
                    nec.mediumParameters(card.f1, card.f2);
                    break;

                case 'XQ': // Execute
                    // Set a default frequency if none has been specified
                    if (!hasFrequency) {
                        output.line('  (Setting default frequency: 299.8 MHz)');
                        nec.frCard(0, 1, 299.8, 0);  // Default to 299.8 MHz
                        hasFrequency = true;
                    }
                    try {
                        nec.xqCard(card.i1);

                        // Check for errors
                        const errorMsg = nec.getErrorMessage();
                        if (errorMsg && errorMsg.length > 0) {
                            output.line(`  Warning: ${errorMsg}`);
                        }

                        // Print impedance results
                        try {
                            const zReal = nec.getImpedanceReal(freqIndex);
                            const zImag = nec.getImpedanceImag(freqIndex);
                            output.line();
                            output.line('ANTENNA INPUT PARAMETERS');
                            output.line(`  Impedance: ${zReal.toExponential(5)} + j${zImag.toExponential(5)} Ohms`);
                            output.line(`  Impedance: ${zReal.toFixed(4)} + j${zImag.toFixed(4)} Ohms`);
                        } catch (e) {
                            // Results might not be available
                        }
                    } catch (e) {
                        output.line(`  XQ execution failed: ${e.message}`);
                        // Continue processing instead of throwing
                    }
                    break;

                case 'PT': // Print current
                    nec.ptCard(card.i1, card.i2, card.i3, card.i4);
                    break;

                case 'PQ': // Print charge
                    nec.pqCard(card.i1, card.i2, card.i3, card.i4);
                    break;

                case 'NE': // Near electric field
                    try {
                        nec.neCard(card.i1, card.i2, card.i3, card.i4, card.f1, card.f2, card.f3, card.f4, card.f5, card.f6);
                    } catch (e) {
                        output.line(`  NE card execution failed: ${e.message}`);
                        // Continue processing
                    }
                    break;

                case 'NH': // Near magnetic field
                    try {
                        nec.nhCard(card.i1, card.i2, card.i3, card.i4, card.f1, card.f2, card.f3, card.f4, card.f5, card.f6);
                    } catch (e) {
                        output.line(`  NH card execution failed: ${e.message}`);
                        // Continue processing
                    }
                    break;

                case 'CP': // Coupling
                    nec.cpCard(card.i1, card.i2, card.i3, card.i4);
                    break;

                case 'RP': // Radiation pattern
                    try {
                        nec.rpCard(card.i1, card.i2, card.i3,
                                  Math.floor(card.i4 / 1000),           // X
                                  Math.floor((card.i4 / 100) % 10),     // N
                                  Math.floor((card.i4 / 10) % 10),      // D
                                  card.i4 % 10,                          // A
                                  card.f1, card.f2, card.f3, card.f4, card.f5, card.f6);

                        // Get and print results
                        try {
                            output.line();
                            output.line('RADIATION PATTERN RESULTS:');
                            const gainMax = nec.getGainMax(freqIndex);
                            const gainMin = nec.getGainMin(freqIndex);
                            const gainMean = nec.getGainMean(freqIndex);
                            const gainSd = nec.getGainSd(freqIndex);
                            const zReal = nec.getImpedanceReal(freqIndex);
                            const zImag = nec.getImpedanceImag(freqIndex);

                            output.line(`  Maximum Gain:        ${gainMax.toFixed(4)} dBi`);
                            output.line(`  Minimum Gain:        ${gainMin.toFixed(4)} dBi`);
                            output.line(`  Mean Gain:           ${gainMean.toFixed(4)} dBi`);
                            output.line(`  Gain Std Dev:        ${gainSd.toFixed(4)} dB`);
                            output.line(`  Impedance:           ${zReal.toFixed(4)} + j${zImag.toFixed(4)} Ohms`);

                            // Try to get pattern data points
                            const nTheta = card.i2;
                            const nPhi = card.i3;

                            if (nTheta > 0 && nPhi > 0) {
                                output.line();
                                output.line('  PATTERN DATA (theta, phi, gain):');
                                for (let t = 0; t < Math.min(nTheta, 5); t++) {
                                    for (let p = 0; p < Math.min(nPhi, 3); p++) {
                                        try {
                                            const gain = nec.getGain(freqIndex, t, p);
                                            const theta = card.f1 + t * card.f3;
                                            const phi = card.f2 + p * card.f4;
                                            output.line(`    ${theta.toFixed(1)}° ${phi.toFixed(1)}° ${gain.toFixed(4)} dBi`);
                                        } catch (e) {
                                            // Silently ignore if gain data not available
                                        }
                                    }
                                }
                            }

                            freqIndex++;
                        } catch (e) {
                            output.line(`  Error retrieving results: ${e.message}`);
                        }
                    } catch (e) {
                        output.line(`  RP card execution failed: ${e.message}`);
                        // Continue processing
                    }
                    break;

                case 'EN': // End
                    output.line();
                    output.line('END OF INPUT');
                    break;
            }
        }

        // Cleanup
        nec.delete();

        // Write output
        fs.writeFileSync(outputFile, output.getOutput());
        console.log(`Output written to: ${outputFile}`);

        return 0;

    } catch (error) {
        console.error('Error processing NEC file:', error.message);
        console.error(error.stack);

        // Write output anyway (might have partial results)
        fs.writeFileSync(outputFile, output.getOutput());
        console.log(`Partial output written to: ${outputFile}`);

        try { nec.delete(); } catch(e) {}
        return 1;
    }
}

// Main
const options = parseArgs();

processNecFile(options.input, options.output)
    .then(code => process.exit(code))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
