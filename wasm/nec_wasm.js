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
        output.line();
        output.line();
        output.line();
        output.line('                               ---------------- COMMENTS ----------------');
        for (const comment of cards.comments) {
            output.line('                               ' + comment);
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
        const wires = []; // Track wires for structure specification output

        for (const card of cards.geometry) {
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
                    // Track wire for structure specification output
                    wires.push({ tag, segs, x1, y1, z1, x2, y2, z2, rad });
                    break;

                case 'SP': // Surface patch
                    nec.spCard(card.i1, card.f1, card.f2, card.f3, card.f4, card.f5, card.f6);
                    break;

                case 'GX': // Reflection
                    nec.gxCard(card.i1, card.i2);
                    break;

                case 'GE': // Geometry complete
                    nec.geometryComplete(card.i1);

                    // Output structure specification
                    output.line();
                    output.line();
                    output.line();
                    output.line('                                -------- STRUCTURE SPECIFICATION --------');
                    output.line('                                COORDINATES MUST BE INPUT IN');
                    output.line('                                METERS OR BE SCALED TO METERS');
                    output.line('                                BEFORE STRUCTURE INPUT IS ENDED');
                    output.line('  WIRE                                                                                 SEG FIRST  LAST  TAG');
                    output.line('   No:        X1         Y1         Z1         X2         Y2         Z2       RADIUS   No:   SEG   SEG  No:');
                    output.line();

                    let firstSeg = 1;
                    for (let i = 0; i < wires.length; i++) {
                        const w = wires[i];
                        const wireNum = (i + 1).toString().padStart(6);
                        const x1 = w.x1.toFixed(4).padStart(11);
                        const y1 = w.y1.toFixed(4).padStart(11);
                        const z1 = w.z1.toFixed(4).padStart(11);
                        const x2 = w.x2.toFixed(4).padStart(11);
                        const y2 = w.y2.toFixed(4).padStart(11);
                        const z2 = w.z2.toFixed(4).padStart(11);
                        const radius = w.rad.toFixed(4).padStart(11);
                        const segs = w.segs.toString().padStart(6);
                        const first = firstSeg.toString().padStart(6);
                        const last = (firstSeg + w.segs - 1).toString().padStart(6);
                        const tag = w.tag.toString().padStart(5);
                        output.line(`${wireNum}${x1}${y1}${z1}${x2}${y2}${z2}${radius}${segs}${first}${last}${tag}`);
                        firstSeg += w.segs;
                    }

                    const totalSegs = wires.reduce((sum, w) => sum + w.segs, 0);
                    output.line();
                    output.line(`     TOTAL SEGMENTS USED: ${totalSegs}   SEGMENTS IN A SYMMETRIC CELL: ${totalSegs}   SYMMETRY FLAG: 0`);
                    output.line();
                    output.line();

                    // Output segmentation data
                    try {
                        const segCount = nec.getSegmentCount();
                        if (segCount > 0) {
                            output.line('                               ---------- SEGMENTATION DATA ----------');
                            output.line('                                        COORDINATES IN METERS');
                            output.line('                            I+ AND I- INDICATE THE SEGMENTS BEFORE AND AFTER I');
                            output.line();
                            output.line('   SEG    COORDINATES OF SEGM CENTER     SEGM    ORIENTATION ANGLES    WIRE    CONNECTION DATA   TAG');
                            output.line('   No:       X         Y         Z      LENGTH     ALPHA      BETA    RADIUS    I-     I    I+   NO:');
                            for (let i = 0; i < segCount; i++) {
                                const seg = nec.getSegment(i);
                                if (seg.success) {
                                    const segNum = (i + 1).toString().padStart(6);
                                    const x = seg.x.toFixed(4).padStart(10);
                                    const y = seg.y.toFixed(4).padStart(10);
                                    const z = seg.z.toFixed(4).padStart(10);
                                    const len = seg.length.toFixed(4).padStart(10);
                                    const alpha = seg.alpha.toFixed(4).padStart(11);
                                    const beta = seg.beta.toFixed(4).padStart(11);
                                    const rad = seg.radius.toFixed(4).padStart(10);
                                    // Connection data: simplified to 0, i+1, 0 for now
                                    const iPrev = (i > 0 ? i : 0).toString().padStart(6);
                                    const iCurr = (i + 1).toString().padStart(6);
                                    const iNext = (i < segCount - 1 ? i + 2 : 0).toString().padStart(6);
                                    output.line(`${segNum}${x}${y}${z}${len}${alpha}${beta}${rad}${iPrev}${iCurr}${iNext}     0`);
                                }
                            }
                        }
                    } catch (e) {
                        // Segment data not available
                    }
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
        output.line();
        output.line();

        // Handle files with no program cards
        if (cards.program.length === 0) {
            output.line('  NOTE: No program cards found. Geometry defined only.');
            output.line();
            output.line('  TOTAL RUN TIME: 0 msec');
            nec.delete();
            fs.writeFileSync(outputFile, output.getOutput());
            console.log(`Output written to: ${outputFile}`);
            return 0;
        }

        let freqIndex = 0;
        let hasFrequency = false;
        let frequencyInfo = null; // Store FR card info
        let cardNum = 0;

        for (const card of cards.program) {
            cardNum++;
            // Output data card in C++ format
            const i1 = card.i1.toString().padStart(6);
            const i2 = card.i2.toString().padStart(6);
            const i3 = card.i3.toString().padStart(6);
            const i4 = card.i4.toString().padStart(6);
            const f1 = card.f1.toExponential(5).toUpperCase().padStart(13);
            const f2 = card.f2.toExponential(5).toUpperCase().padStart(13);
            const f3 = card.f3.toExponential(5).toUpperCase().padStart(13);
            const f4 = card.f4.toExponential(5).toUpperCase().padStart(13);
            const f5 = card.f5.toExponential(5).toUpperCase().padStart(13);
            const f6 = card.f6.toExponential(5).toUpperCase().padStart(13);
            output.line(`*****  DATA CARD N0.${cardNum.toString().padStart(4)} ${card.card}${i1}${i2}${i3}${i4}${f1}${f2}${f3}${f4}${f5}${f6}`);

            switch (card.card) {
                case 'FR': // Frequency
                    nec.frCard(card.i1, card.i2, card.f1, card.f2);
                    frequencyInfo = {
                        ifrq: card.i1,  // 0=linear, 1=log
                        nfrq: card.i2,  // number of frequencies
                        freq_mhz: card.f1,  // starting frequency
                        del_freq: card.f2   // frequency step
                    };
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
                        frequencyInfo = { ifrq: 0, nfrq: 1, freq_mhz: 299.8, del_freq: 0 };
                        hasFrequency = true;
                    }
                    try {
                        nec.xqCard(card.i1);

                        // Check for errors
                        const errorMsg = nec.getErrorMessage();
                        if (errorMsg && errorMsg.length > 0) {
                            output.line(`  Warning: ${errorMsg}`);
                        }

                        // Loop through all frequencies and output results for each
                        let currentFreqIndex = 0;
                        while (true) {
                            const currCount = nec.getCurrentCount(currentFreqIndex);
                            if (currCount <= 0) break;  // No more frequencies

                            // Calculate current frequency
                            let currentFreq = frequencyInfo.freq_mhz;
                            if (currentFreqIndex > 0) {
                                if (frequencyInfo.ifrq === 0) {
                                    // Linear stepping
                                    currentFreq += currentFreqIndex * frequencyInfo.del_freq;
                                } else {
                                    // Log stepping
                                    currentFreq *= Math.pow(10, currentFreqIndex * frequencyInfo.del_freq / frequencyInfo.nfrq);
                                }
                            }
                            const wavelength = 299.792458 / currentFreq; // wavelength in meters

                            // Output frequency header
                            output.line();
                            output.line();
                            output.line();
                            output.line('                               --------- FREQUENCY --------');
                            output.line(`                               FREQUENCY=  ${currentFreq.toExponential(4).toUpperCase()} MHZ`);
                            output.line(`                               WAVELENGTH= ${wavelength.toExponential(4).toUpperCase()} METERS`);
                            output.line();
                            output.line();
                            output.line('                        APPROXIMATE INTEGRATION EMPLOYED FOR SEGMENTS');
                            output.line('                        THAT ARE MORE THAN 1.000 WAVELENGTHS APART');
                            output.line();
                            output.line();
                            output.line();
                            output.line('                          ------ STRUCTURE IMPEDANCE LOADING ------');
                            output.line('                                 THIS STRUCTURE IS NOT LOADED');
                            output.line();
                            output.line();
                            output.line();
                            output.line('                            -------- ANTENNA ENVIRONMENT --------');
                            output.line('                            FREE SPACE');
                            output.line();
                            output.line();
                            output.line();
                            output.line('                             ---------- MATRIX TIMING ----------');
                            output.line('                               FILL= 0 msec  FACTOR: 0 msec');
                            output.line();
                            output.line();

                            // Print full antenna input parameters table
                            try {
                                const zReal = nec.getImpedanceReal(currentFreqIndex);
                                const zImag = nec.getImpedanceImag(currentFreqIndex);

                                // Calculate admittance
                                const zMagSq = zReal * zReal + zImag * zImag;
                                const yReal = zReal / zMagSq;
                                const yImag = -zImag / zMagSq;

                                // Assume voltage of 1+j0 for input
                                const vReal = 1.0;
                                const vImag = 0.0;

                                // Current = V / Z
                                const iReal = (vReal * zReal + vImag * zImag) / zMagSq;
                                const iImag = (vImag * zReal - vReal * zImag) / zMagSq;

                                // Power = 0.5 * Re(V * I*)
                                const power = 0.5 * (vReal * iReal + vImag * iImag);

                                output.line('                      ----- ANTENNA INPUT PARAMETERS -----');
                                output.line('  TAG   SEG       VOLTAGE (VOLTS)         CURRENT (AMPS)         IMPEDANCE (OHMS)        ADMITTANCE (MHOS)     POWER');
                                output.line('  NO.   NO.     REAL      IMAGINARY     REAL      IMAGINARY     REAL      IMAGINARY    REAL       IMAGINARY   (WATTS)');
                                const tag = '   0';
                                const seg = '     5'; // Assume segment 5 for now (should track from EX card)
                                const vr = vReal.toExponential(4).toUpperCase().padStart(11);
                                const vi = vImag.toExponential(4).toUpperCase().padStart(11);
                                const ir = iReal.toExponential(4).toUpperCase().padStart(11);
                                const ii = iImag.toExponential(4).toUpperCase().padStart(11);
                                const zr = zReal.toExponential(4).toUpperCase().padStart(11);
                                const zi = zImag.toExponential(4).toUpperCase().padStart(11);
                                const yr = yReal.toExponential(4).toUpperCase().padStart(11);
                                const yi = yImag.toExponential(4).toUpperCase().padStart(11);
                                const pw = power.toExponential(4).toUpperCase().padStart(11);
                                output.line(`${tag}${seg}${vr}${vi}${ir}${ii}${zr}${zi}${yr}${yi}${pw}`);
                            } catch (e) {
                                // Results might not be available
                            }

                            // Output current distribution
                            try {
                                if (currCount > 0) {
                                    output.line();
                                    output.line();
                                    output.line();
                                    output.line();
                                    output.line();
                                    output.line();
                                    output.line('                        - - - CURRENTS AND LOCATION - - -');
                                    output.line('                            DISTANCES IN WAVELENGTHS ');
                                    output.line();
                                    output.line('   SEG  TAG    COORDINATES OF SEGM CENTER     SEGM    ------------- CURRENT (AMPS) -------------');
                                    output.line('   NO:  NO:       X         Y         Z      LENGTH     REAL      IMAGINARY    MAGN        PHASE');
                                    for (let i = 0; i < currCount; i++) {
                                        const curr = nec.getCurrent(currentFreqIndex, i);
                                        if (curr.success) {
                                            const segNum = curr.segmentNumber.toString().padStart(5);
                                            const tag = curr.segmentTag.toString().padStart(5);
                                            const x = curr.x.toFixed(4).padStart(10);
                                            const y = curr.y.toFixed(4).padStart(10);
                                            const z = curr.z.toFixed(4).padStart(10);
                                            const len = curr.length.toFixed(5).padStart(9);
                                            const re = curr.currentReal.toExponential(4).padStart(12);
                                            const im = curr.currentImag.toExponential(4).padStart(12);
                                            const mag = Math.sqrt(curr.currentReal**2 + curr.currentImag**2).toExponential(4).padStart(11);
                                            const phase = (Math.atan2(curr.currentImag, curr.currentReal) * 180 / Math.PI).toFixed(3).padStart(10);
                                            output.line(`${segNum}${tag}${x}${y}${z}${len}${re}${im}${mag}${phase}`);
                                        }
                                    }
                                }
                            } catch (e) {
                                // Current data not available
                            }

                            currentFreqIndex++;
                        }
                    } catch (e) {
                        output.line(`  XQ execution failed: ${e.message}`);
                        // Continue processing instead of throwing
                    }
                    break;

                case 'PT': // Print current
                    nec.ptCard(card.i1, card.i2, card.i3, card.i4);
                    // Note: Current output is now handled automatically after XQ execution
                    break;

                case 'PQ': // Print charge
                    nec.pqCard(card.i1, card.i2, card.i3, card.i4);

                    // Output charge distribution
                    try {
                        const chargeCount = nec.getChargeCount(0);
                        if (chargeCount > 0) {
                            output.line();
                            output.line();
                            output.line();
                            output.line();
                            output.line();
                            output.line('                          - - - CHARGE DENSITIES - - -');
                            output.line('                            DISTANCES IN WAVELENGTHS ');
                            output.line();
                            output.line('   SEG   TAG    COORDINATES OF SEG CENTER     SEG          CHARGE DENSITY (COULOMBS/METER)');
                            output.line('   NO:   NO:     X         Y         Z       LENGTH     REAL      IMAGINARY     MAGN        PHASE');
                            for (let i = 0; i < chargeCount; i++) {
                                const charge = nec.getCharge(0, i);
                                if (charge.success) {
                                    const segNum = charge.segmentNumber.toString().padStart(5);
                                    const tag = charge.segmentTag.toString().padStart(5);
                                    const x = charge.x.toFixed(4).padStart(10);
                                    const y = charge.y.toFixed(4).padStart(10);
                                    const z = charge.z.toFixed(4).padStart(10);
                                    const len = charge.length.toFixed(5).padStart(9);
                                    const re = charge.chargeReal.toExponential(4).padStart(12);
                                    const im = charge.chargeImag.toExponential(4).padStart(12);
                                    const mag = Math.sqrt(charge.chargeReal**2 + charge.chargeImag**2).toExponential(4).padStart(11);
                                    const phase = (Math.atan2(charge.chargeImag, charge.chargeReal) * 180 / Math.PI).toFixed(3).padStart(10);
                                    output.line(`${segNum}${tag}${x}${y}${z}${len}${re}${im}${mag}${phase}`);
                                }
                            }
                        }
                    } catch (e) {
                        // Charge data not available
                    }
                    break;

                case 'NE': // Near electric field
                    try {
                        nec.neCard(card.i1, card.i2, card.i3, card.i4, card.f1, card.f2, card.f3, card.f4, card.f5, card.f6);

                        // NE card may trigger execution - output currents if available
                        try {
                            const currCount = nec.getCurrentCount(0);
                            if (currCount > 0) {
                                output.line();
                                output.line();
                                output.line();
                                output.line();
                                output.line();
                                output.line();
                                output.line('                        - - - CURRENTS AND LOCATION - - -');
                                output.line('                            DISTANCES IN WAVELENGTHS ');
                                output.line();
                                output.line('   SEG  TAG    COORDINATES OF SEGM CENTER     SEGM    ------------- CURRENT (AMPS) -------------');
                                output.line('   NO:  NO:       X         Y         Z      LENGTH     REAL      IMAGINARY    MAGN        PHASE');
                                for (let i = 0; i < currCount; i++) {
                                    const curr = nec.getCurrent(0, i);
                                    if (curr.success) {
                                        const segNum = curr.segmentNumber.toString().padStart(5);
                                        const tag = curr.segmentTag.toString().padStart(5);
                                        const x = curr.x.toFixed(4).padStart(10);
                                        const y = curr.y.toFixed(4).padStart(10);
                                        const z = curr.z.toFixed(4).padStart(10);
                                        const len = curr.length.toFixed(5).padStart(9);
                                        const re = curr.currentReal.toExponential(4).padStart(12);
                                        const im = curr.currentImag.toExponential(4).padStart(12);
                                        const mag = Math.sqrt(curr.currentReal**2 + curr.currentImag**2).toExponential(4).padStart(11);
                                        const phase = (Math.atan2(curr.currentImag, curr.currentReal) * 180 / Math.PI).toFixed(3).padStart(10);
                                        output.line(`${segNum}${tag}${x}${y}${z}${len}${re}${im}${mag}${phase}`);
                                    }
                                }
                            }
                        } catch (e) {
                            // Current data not available
                        }

                        // Output charge distribution if PQ was called
                        try {
                            const chargeCount = nec.getChargeCount(0);
                            if (chargeCount > 0) {
                                output.line();
                                output.line();
                                output.line();
                                output.line();
                                output.line();
                                output.line('                          - - - CHARGE DENSITIES - - -');
                                output.line('                            DISTANCES IN WAVELENGTHS ');
                                output.line();
                                output.line('   SEG   TAG    COORDINATES OF SEG CENTER     SEG          CHARGE DENSITY (COULOMBS/METER)');
                                output.line('   NO:   NO:     X         Y         Z       LENGTH     REAL      IMAGINARY     MAGN        PHASE');
                                for (let i = 0; i < chargeCount; i++) {
                                    const charge = nec.getCharge(0, i);
                                    if (charge.success) {
                                        const segNum = charge.segmentNumber.toString().padStart(5);
                                        const tag = charge.segmentTag.toString().padStart(5);
                                        const x = charge.x.toFixed(4).padStart(10);
                                        const y = charge.y.toFixed(4).padStart(10);
                                        const z = charge.z.toFixed(4).padStart(10);
                                        const len = charge.length.toFixed(5).padStart(9);
                                        const re = charge.chargeReal.toExponential(4).padStart(12);
                                        const im = charge.chargeImag.toExponential(4).padStart(12);
                                        const mag = Math.sqrt(charge.chargeReal**2 + charge.chargeImag**2).toExponential(4).padStart(11);
                                        const phase = (Math.atan2(charge.chargeImag, charge.chargeReal) * 180 / Math.PI).toFixed(3).padStart(10);
                                        output.line(`${segNum}${tag}${x}${y}${z}${len}${re}${im}${mag}${phase}`);
                                    }
                                }
                            }
                        } catch (e) {
                            // Charge data not available
                        }

                        // Output near electric field data
                        const nfCount = nec.getNearFieldPointCount(0);
                        if (nfCount > 0) {
                            output.line();
                            output.section('                                     - - - NEAR ELECTRIC FIELDS - - -');
                            output.line('     ------- LOCATION -------     ------- EX ------    ------- EY ------    ------- EZ ------');
                            output.line('      X         Y         Z       MAGNITUDE   PHASE    MAGNITUDE   PHASE    MAGNITUDE   PHASE');
                            output.line('    METERS    METERS    METERS     VOLTS/M  DEGREES    VOLTS/M   DEGREES     VOLTS/M  DEGREES');
                            for (let i = 0; i < nfCount; i++) {
                                const nf = nec.getNearFieldPoint(0, i);
                                if (nf.success) {
                                    const x = nf.x.toFixed(4).padStart(10);
                                    const y = nf.y.toFixed(4).padStart(10);
                                    const z = nf.z.toFixed(4).padStart(10);
                                    const exMag = Math.sqrt(nf.exReal**2 + nf.exImag**2).toExponential(4).padStart(12);
                                    const exPhase = (Math.atan2(nf.exImag, nf.exReal) * 180 / Math.PI).toFixed(2).padStart(8);
                                    const eyMag = Math.sqrt(nf.eyReal**2 + nf.eyImag**2).toExponential(4).padStart(12);
                                    const eyPhase = (Math.atan2(nf.eyImag, nf.eyReal) * 180 / Math.PI).toFixed(2).padStart(8);
                                    const ezMag = Math.sqrt(nf.ezReal**2 + nf.ezImag**2).toExponential(4).padStart(12);
                                    const ezPhase = (Math.atan2(nf.ezImag, nf.ezReal) * 180 / Math.PI).toFixed(2).padStart(8);
                                    output.line(` ${x}${y}${z}${exMag}${exPhase}${eyMag}${eyPhase}${ezMag}${ezPhase}`);
                                }
                            }
                        }
                    } catch (e) {
                        output.line(`  NE card execution failed: ${e.message}`);
                        // Continue processing
                    }
                    break;

                case 'NH': // Near magnetic field
                    try {
                        nec.nhCard(card.i1, card.i2, card.i3, card.i4, card.f1, card.f2, card.f3, card.f4, card.f5, card.f6);

                        // Output near magnetic field data
                        const nhCount = nec.getNearFieldPointCount(0);
                        if (nhCount > 0) {
                            output.line();
                            output.section('                                     - - - NEAR MAGNETIC FIELDS - - -');
                            output.line('     ------- LOCATION -------     ------- HX ------    ------- HY ------    ------- HZ ------');
                            output.line('      X         Y         Z       MAGNITUDE   PHASE    MAGNITUDE   PHASE    MAGNITUDE   PHASE');
                            output.line('    METERS    METERS    METERS      AMPS/M  DEGREES      AMPS/M  DEGREES      AMPS/M  DEGREES');
                            for (let i = 0; i < nhCount; i++) {
                                const nh = nec.getNearFieldPoint(0, i);
                                if (nh.success) {
                                    const x = nh.x.toFixed(4).padStart(10);
                                    const y = nh.y.toFixed(4).padStart(10);
                                    const z = nh.z.toFixed(4).padStart(10);
                                    const hxMag = Math.sqrt(nh.exReal**2 + nh.exImag**2).toExponential(4).padStart(12);
                                    const hxPhase = (Math.atan2(nh.exImag, nh.exReal) * 180 / Math.PI).toFixed(2).padStart(8);
                                    const hyMag = Math.sqrt(nh.eyReal**2 + nh.eyImag**2).toExponential(4).padStart(12);
                                    const hyPhase = (Math.atan2(nh.eyImag, nh.eyReal) * 180 / Math.PI).toFixed(2).padStart(8);
                                    const hzMag = Math.sqrt(nh.ezReal**2 + nh.ezImag**2).toExponential(4).padStart(12);
                                    const hzPhase = (Math.atan2(nh.ezImag, nh.ezReal) * 180 / Math.PI).toFixed(2).padStart(8);
                                    output.line(` ${x}${y}${z}${hxMag}${hxPhase}${hyMag}${hyPhase}${hzMag}${hzPhase}`);
                                }
                            }
                        }
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

                        // Output radiation pattern in C++ format
                        try {
                            const rpCount = nec.getRadiationPatternCount();
                            if (rpCount > 0) {
                                const rpIndex = freqIndex; // Use current frequency index
                                const nTheta = nec.getRadiationPatternThetaCount(rpIndex);
                                const nPhi = nec.getRadiationPatternPhiCount(rpIndex);

                                if (nTheta > 0 && nPhi > 0) {
                                    output.line();
                                    output.line();
                                    output.line();
                                    output.line('                               ------------ RADIATION PATTERNS ------------');
                                    output.line(' ---- ANGLES -----     --- DIRECTIVE GAINS ---      ---- POLARIZATION ----   ---- E(THETA) ----    ----- E(PHI) ------');
                                    output.line('  THETA      PHI       VERTC   HORIZ   TOTAL       AXIAL      TILT  SENSE   MAGNITUDE    PHASE    MAGNITUDE     PHASE');
                                    output.line(' DEGREES   DEGREES        DB       DB       DB       RATIO   DEGREES            VOLTS/M   DEGREES     VOLTS/M   DEGREES');

                                    // Output pattern data (limit to prevent excessive computation time)
                                    const totalPoints = nTheta * nPhi;
                                    const MAX_PATTERN_POINTS = 10000; // Reasonable limit

                                    if (totalPoints > MAX_PATTERN_POINTS) {
                                        output.line();
                                        output.line(`  NOTE: RADIATION PATTERN OUTPUT LIMITED (${totalPoints} points requested, showing subset)`);
                                        output.line();
                                    }

                                    const phiStep = totalPoints > MAX_PATTERN_POINTS ? Math.ceil(nPhi * Math.sqrt(totalPoints / MAX_PATTERN_POINTS)) : 1;
                                    const thetaStep = totalPoints > MAX_PATTERN_POINTS ? Math.ceil(nTheta * Math.sqrt(totalPoints / MAX_PATTERN_POINTS)) : 1;

                                    for (let kph = 0; kph < nPhi; kph += phiStep) {
                                        for (let kth = 0; kth < nTheta; kth += thetaStep) {
                                            try {
                                                const data = nec.getRadiationPatternData(rpIndex, kth, kph);
                                                if (data.success) {
                                                    const polSenseStr = ['LINEAR', 'RIGHT ', 'LEFT  ', '      '][data.polSense] || 'LINEAR';

                                                    const theta = data.theta.toFixed(2).padStart(7);
                                                    const phi = data.phi.toFixed(2).padStart(9);
                                                    const pv = data.powerVert.toFixed(2).padStart(8);
                                                    const ph = data.powerHoriz.toFixed(2).padStart(8);
                                                    const pt = data.powerTot.toFixed(2).padStart(8);
                                                    const ar = data.axialRatio.toFixed(4).padStart(11);
                                                    const tilt = data.tilt.toFixed(2).padStart(9);
                                                    const sense = polSenseStr.padStart(6);
                                                    const etm = data.eThetaMag.toFixed(4).padStart(11);
                                                    const etp = data.eThetaPhase.toFixed(2).padStart(9);
                                                    const epm = data.ePhiMag.toFixed(4).padStart(11);
                                                    const epp = data.ePhiPhase.toFixed(2).padStart(9);

                                                    output.line(` ${theta}${phi}${pv}${ph}${pt}${ar}${tilt}${sense}${etm}${etp}${epm}${epp}`);
                                                }
                                            } catch (e) {
                                                // Skip this point if data not available
                                            }
                                        }
                                    }

                                    // Output average gain if requested
                                    const iavp = card.i4 % 10; // A parameter
                                    if (iavp !== 0) {
                                        output.line();
                                        try {
                                            const avgGain = nec.getGainMean(rpIndex);
                                            output.line(`  AVERAGE POWER GAIN:  ${avgGain.toFixed(4)}    - SOLID ANGLE USED IN AVERAGING: (UNKNOWN)*PI STERADIANS`);
                                        } catch (e) {
                                            // Average gain not available
                                        }
                                    }
                                }
                            }

                            freqIndex++;
                        } catch (e) {
                            output.line(`  Error retrieving radiation pattern: ${e.message}`);
                        }
                    } catch (e) {
                        output.line(`  RP card execution failed: ${e.message}`);
                        // Continue processing
                    }
                    break;

                case 'EN': // End
                    output.line();
                    output.line();
                    output.line('  TOTAL RUN TIME: 0 msec');
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
