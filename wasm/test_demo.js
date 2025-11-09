#!/usr/bin/env node

/**
 * Headless test for NEC++ WASM demo
 * This test verifies that:
 * 1. The necpp.js module can be loaded
 * 2. The createNecppModule function is defined
 * 3. The module initializes correctly
 * 4. A simple simulation can run successfully
 */

const fs = require('fs');
const path = require('path');

// Check that required files exist
const requiredFiles = ['necpp.js', 'necpp.wasm'];
for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ ERROR: Required file not found: ${file}`);
        process.exit(1);
    }
}
console.log('✓ All required files found');

// Load the module
let createNecppModule;
try {
    createNecppModule = require('./necpp.js');
    console.log('✓ necpp.js loaded successfully');
} catch (err) {
    console.error('❌ ERROR: Failed to load necpp.js:', err.message);
    process.exit(1);
}

// Check that createNecppModule is a function
if (typeof createNecppModule !== 'function') {
    console.error('❌ ERROR: createNecppModule is not a function');
    console.error('   Type:', typeof createNecppModule);
    process.exit(1);
}
console.log('✓ createNecppModule is defined as a function');

// Initialize the module
async function runTest() {
    try {
        console.log('\nInitializing NEC++ module...');
        const Module = await createNecppModule();
        console.log('✓ Module initialized successfully');

        // Check that NecppWrapper is available
        if (typeof Module.NecppWrapper !== 'function') {
            console.error('❌ ERROR: NecppWrapper not found in module');
            process.exit(1);
        }
        console.log('✓ NecppWrapper class is available');

        // Create a new NEC++ context
        const nec = new Module.NecppWrapper();
        console.log('✓ NecppWrapper instance created');

        // Run a simple simulation (half-wave dipole)
        console.log('\nRunning simple half-wave dipole simulation...');

        // Define geometry: simple dipole antenna along Z-axis
        nec.wire(
            1,              // tag
            11,             // number of segments
            0, 0, -0.25,    // wire start (x1, y1, z1)
            0, 0, 0.25,     // wire end (x2, y2, z2)
            0.001,          // wire radius
            1.0, 1.0        // rdel, rrad
        );
        console.log('✓ Wire geometry defined');

        // Complete geometry (no ground plane)
        nec.geometryComplete(0);
        console.log('✓ Geometry completed');

        // Set up ground parameters (free space)
        nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
        console.log('✓ Ground parameters set');

        // Set frequency (299.8 MHz)
        nec.frCard(0, 1, 299.8, 0);
        console.log('✓ Frequency set to 299.8 MHz');

        // Add excitation (voltage source at center)
        nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);
        console.log('✓ Excitation source added');

        // Calculate radiation pattern
        nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);
        console.log('✓ Radiation pattern calculated');

        // Get results
        const gainMax = nec.getGainMax(0);
        const gainMin = nec.getGainMin(0);
        const gainMean = nec.getGainMean(0);
        const impedanceReal = nec.getImpedanceReal(0);
        const impedanceImag = nec.getImpedanceImag(0);

        console.log('\n=== Simulation Results ===');
        console.log(`Maximum Gain: ${gainMax.toFixed(2)} dBi`);
        console.log(`Minimum Gain: ${gainMin.toFixed(2)} dBi`);
        console.log(`Mean Gain: ${gainMean.toFixed(2)} dBi`);
        console.log(`Impedance: ${impedanceReal.toFixed(2)} + j${impedanceImag.toFixed(2)} Ω`);

        // Validate results are reasonable
        if (isNaN(gainMax) || isNaN(impedanceReal)) {
            console.error('❌ ERROR: Invalid simulation results');
            process.exit(1);
        }
        console.log('✓ Simulation results are valid');

        // Clean up
        nec.delete();
        console.log('✓ NEC++ context cleaned up');

        console.log('\n✅ All tests passed! The demo should work correctly.');
        console.log('\nTo test in the browser:');
        console.log('1. Start a web server: python3 -m http.server 8000');
        console.log('2. Open http://localhost:8000/demo.html');
        console.log('3. Click "Run Simulation" button');

    } catch (err) {
        console.error('❌ ERROR during simulation:', err.message);
        console.error('Stack trace:', err.stack);
        process.exit(1);
    }
}

// Run the test
runTest();
