#!/usr/bin/env node

/**
 * Test script for NEC++ WebAssembly build
 *
 * This script tests the compiled WebAssembly module to ensure
 * it works correctly. Run with: node test_build.js
 */

const fs = require('fs');
const path = require('path');

// Check if the build files exist
const jsFile = path.join(__dirname, 'necpp.js');
const wasmFile = path.join(__dirname, 'necpp.wasm');

console.log('NEC++ WebAssembly Build Test');
console.log('============================\n');

// Check if files exist
if (!fs.existsSync(jsFile)) {
    console.error('ERROR: necpp.js not found!');
    console.error('Please build the module first: make or ./build.sh');
    process.exit(1);
}

if (!fs.existsSync(wasmFile)) {
    console.error('ERROR: necpp.wasm not found!');
    console.error('Please build the module first: make or ./build.sh');
    process.exit(1);
}

console.log('✓ Found necpp.js');
console.log('✓ Found necpp.wasm\n');

// Load the module
const createNecppModule = require('./necpp.js');

console.log('Loading WebAssembly module...');

createNecppModule().then(function(Module) {
    console.log('✓ Module loaded successfully\n');

    console.log('Running test simulation...');

    try {
        // Create context
        const nec = new Module.NecppWrapper();
        console.log('✓ Created NEC++ context');

        // Define a simple half-wave dipole
        nec.wire(1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
        console.log('✓ Added wire geometry');

        nec.geometryComplete(0);
        console.log('✓ Geometry completed');

        // Set frequency
        nec.frCard(0, 1, 299.8, 0);
        console.log('✓ Set frequency to 299.8 MHz');

        // Add excitation
        nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);
        console.log('✓ Added voltage excitation');

        // Set ground (free space)
        nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
        console.log('✓ Set ground parameters (free space)');

        // Calculate radiation pattern
        nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);
        console.log('✓ Calculated radiation pattern');

        // Get results
        const gainMax = nec.getGainMax(0);
        const gainMin = nec.getGainMin(0);
        const gainMean = nec.getGainMean(0);
        const zReal = nec.getImpedanceReal(0);
        const zImag = nec.getImpedanceImag(0);

        console.log('\nSimulation Results:');
        console.log('-------------------');
        console.log(`Maximum Gain:  ${gainMax.toFixed(2)} dBi`);
        console.log(`Minimum Gain:  ${gainMin.toFixed(2)} dBi`);
        console.log(`Mean Gain:     ${gainMean.toFixed(2)} dBi`);
        console.log(`Impedance:     ${zReal.toFixed(2)} + j${zImag.toFixed(2)} Ω`);

        // Validate results (half-wave dipole should have ~2.15 dBi gain and ~73Ω impedance)
        let allTestsPassed = true;

        console.log('\nValidation:');
        console.log('-----------');

        // Check gain (should be around 2.15 dBi for half-wave dipole)
        if (gainMax > 1.5 && gainMax < 3.0) {
            console.log('✓ Gain is in expected range (1.5 to 3.0 dBi)');
        } else {
            console.log(`✗ WARNING: Gain ${gainMax.toFixed(2)} dBi is outside expected range`);
            allTestsPassed = false;
        }

        // Check impedance real part (should be around 73Ω for half-wave dipole)
        if (zReal > 50 && zReal < 90) {
            console.log('✓ Real impedance is in expected range (50 to 90 Ω)');
        } else {
            console.log(`✗ WARNING: Real impedance ${zReal.toFixed(2)} Ω is outside expected range`);
            allTestsPassed = false;
        }

        // Check imaginary part (should be close to 0 for resonant dipole)
        if (Math.abs(zImag) < 50) {
            console.log('✓ Imaginary impedance is in expected range (-50 to 50 Ω)');
        } else {
            console.log(`✗ WARNING: Imaginary impedance ${zImag.toFixed(2)} Ω is outside expected range`);
            allTestsPassed = false;
        }

        // Test radiation pattern data access
        const rpCount = nec.getRpCount();
        if (rpCount > 0) {
            console.log(`✓ Radiation pattern data accessible (${rpCount} pattern(s))`);

            const ntheta = nec.getRpNtheta(0);
            const nphi = nec.getRpNphi(0);
            console.log(`✓ Pattern dimensions: ${ntheta} theta × ${nphi} phi`);

            // Test accessing a few pattern points
            try {
                const theta0 = nec.getRpTheta(0, 0, 0);
                const gain0 = nec.getRpGainTot(0, 0, 0);
                console.log(`✓ Pattern data accessible (θ=${theta0.toFixed(1)}°, gain=${gain0.toFixed(2)} dBi)`);
            } catch (e) {
                console.log('✗ ERROR: Could not access pattern data');
                allTestsPassed = false;
            }
        } else {
            console.log('✗ WARNING: No radiation pattern data available');
            allTestsPassed = false;
        }

        // Clean up
        nec.delete();
        console.log('✓ Cleaned up context');

        console.log('\n============================');
        if (allTestsPassed) {
            console.log('✓ ALL TESTS PASSED');
            console.log('============================\n');
            console.log('The WebAssembly build is working correctly!');
            console.log('You can now use demo.html or create your own applications.');
            process.exit(0);
        } else {
            console.log('⚠ SOME TESTS FAILED');
            console.log('============================\n');
            console.log('The build appears to work but results are unexpected.');
            console.log('This might indicate a compilation issue.');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n✗ ERROR during simulation:', error.message);
        console.error('\nStack trace:', error.stack);
        console.error('\nThe WebAssembly module may not be built correctly.');
        process.exit(1);
    }

}).catch(function(error) {
    console.error('\n✗ ERROR loading module:', error.message);
    console.error('\nThe WebAssembly module failed to load.');
    console.error('Try rebuilding with: make clean && make');
    process.exit(1);
});
