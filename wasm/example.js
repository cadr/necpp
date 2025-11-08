/**
 * NEC++ WebAssembly Simple Example
 *
 * This example demonstrates how to use NEC++ in Node.js or a JavaScript
 * environment to simulate a simple dipole antenna.
 */

// For Node.js, you would require the module like this:
// const createNecppModule = require('./necpp.js');

// Function to run a simple dipole simulation
async function runDipoleSimulation() {
    console.log('Loading NEC++ WebAssembly module...');

    // Load the module
    const necModule = await createNecppModule();

    console.log('Module loaded! Running simulation...\n');

    // Create a new NEC++ context
    const nec = new necModule.NecppWrapper();

    // Simulation parameters
    const frequency = 299.8;        // MHz (approximately 1 meter wavelength)
    const wireLength = 0.5;         // meters (half-wave dipole)
    const wireRadius = 0.001;       // meters (1mm)
    const segments = 11;            // number of segments

    console.log('Antenna Configuration:');
    console.log('---------------------');
    console.log(`Frequency: ${frequency} MHz`);
    console.log(`Wire length: ${wireLength} m`);
    console.log(`Wire radius: ${wireRadius * 1000} mm`);
    console.log(`Segments: ${segments}\n`);

    // Define geometry: dipole antenna along Z-axis
    const halfLength = wireLength / 2.0;
    nec.wire(
        1,                          // tag
        segments,                   // number of segments
        0, 0, -halfLength,          // wire start (x1, y1, z1)
        0, 0, halfLength,           // wire end (x2, y2, z2)
        wireRadius,                 // wire radius
        1.0, 1.0                    // rdel, rrad
    );

    // Complete geometry (no ground plane)
    nec.geometryComplete(0);

    // Set up ground parameters (free space)
    nec.gnCard(
        -1,     // free space
        0,      // nradl
        0, 0,   // epsr, sig
        0, 0, 0, 0
    );

    // Set frequency
    nec.frCard(
        0,          // frequency type
        1,          // number of frequencies
        frequency,  // frequency in MHz
        0           // frequency increment
    );

    // Add excitation (voltage source at center)
    const centerSegment = Math.floor(segments / 2) + 1;
    nec.exCard(
        0,              // excitation type (voltage)
        1,              // tag
        centerSegment,  // segment number
        0,              // unused
        1.0, 0.0,       // voltage (real, imaginary)
        0, 0, 0, 0
    );

    // Calculate radiation pattern
    nec.rpCard(
        0,      // normal mode
        91,     // number of theta angles
        1,      // number of phi angles
        0,      // output format
        5,      // normalization
        0, 0,   // D, A
        0, 0,   // theta0, phi0
        1, 0,   // delta theta, delta phi
        0, 0    // radial distance, gain norm
    );

    // Get results
    const gainMax = nec.getGainMax(0);
    const gainMin = nec.getGainMin(0);
    const gainMean = nec.getGainMean(0);
    const impedanceReal = nec.getImpedanceReal(0);
    const impedanceImag = nec.getImpedanceImag(0);

    // Display results
    console.log('Simulation Results:');
    console.log('------------------');
    console.log(`Maximum Gain: ${gainMax.toFixed(2)} dBi`);
    console.log(`Minimum Gain: ${gainMin.toFixed(2)} dBi`);
    console.log(`Mean Gain: ${gainMean.toFixed(2)} dBi`);
    console.log(`Impedance: ${impedanceReal.toFixed(2)} + j${impedanceImag.toFixed(2)} Ω`);

    // Calculate SWR
    const z0 = 50.0;
    const gamma = Math.sqrt(
        Math.pow(impedanceReal - z0, 2) + Math.pow(impedanceImag, 2)
    ) / Math.sqrt(
        Math.pow(impedanceReal + z0, 2) + Math.pow(impedanceImag, 2)
    );
    const swr = (1 + gamma) / (1 - gamma);
    console.log(`SWR (50Ω): ${swr.toFixed(2)}:1`);

    // Note: Detailed radiation pattern data access is not available in the
    // C API bindings. For detailed pattern analysis, use the C++ API directly.
    // The simplified API provides aggregate statistics (max, min, mean, sd).

    // Clean up
    nec.delete();

    console.log('\nSimulation complete!');
}

// Run the simulation if this is the main module
if (typeof createNecppModule !== 'undefined') {
    runDipoleSimulation().catch(err => {
        console.error('Error running simulation:', err);
    });
} else {
    console.log('This example requires the NEC++ WebAssembly module.');
    console.log('Include necpp.js before this script in a browser,');
    console.log('or use: node --experimental-modules example.js');
}
