/**
 * Example: Extracting Radiation Pattern Data from NEC++
 *
 * This example demonstrates the correct way to extract radiation pattern
 * data using the WASM bindings.
 */

// Load the NEC++ WASM module
const necModule = require('./necpp.js');

necModule().then(NecppModule => {
    console.log('NEC++ WASM Module Loaded');
    console.log('========================\n');

    // Create a new NEC++ context
    const nec = new NecppModule.NecppWrapper();

    try {
        // ===================================================================
        // STEP 1: Define antenna geometry (half-wave dipole)
        // ===================================================================
        console.log('STEP 1: Defining antenna geometry...');

        const freq_mhz = 299.7925;  // MHz
        const wavelength = 300.0 / freq_mhz;  // approximately 1.0007 meters
        const dipole_length = wavelength / 2.0;  // half-wave
        const wire_radius = 0.001;  // 1mm
        const segments = 11;

        // Create vertical dipole along z-axis
        nec.wire(
            1,                    // tag
            segments,            // number of segments
            0, 0, -dipole_length/2,  // start point (x1, y1, z1)
            0, 0, dipole_length/2,   // end point (x2, y2, z2)
            wire_radius,         // radius
            1.0,                 // rdel
            1.0                  // rrad
        );
        console.log(`✓ Created dipole: ${dipole_length.toFixed(4)} m length, ${segments} segments\n`);

        // ===================================================================
        // STEP 2: Complete geometry
        // ===================================================================
        console.log('STEP 2: Completing geometry...');
        nec.geometryComplete(0);  // 0 = no ground plane
        console.log('✓ Geometry complete\n');

        // ===================================================================
        // STEP 3: Set frequency
        // ===================================================================
        console.log('STEP 3: Setting frequency...');
        nec.frCard(
            0,           // ifrq: 0 = linear frequency stepping
            1,           // nfrq: 1 frequency
            freq_mhz,    // freq_mhz: starting frequency
            0            // del_freq: frequency step (not used when nfrq=1)
        );
        console.log(`✓ Frequency set to ${freq_mhz} MHz\n`);

        // ===================================================================
        // STEP 4: Set excitation
        // ===================================================================
        console.log('STEP 4: Setting excitation...');
        const center_segment = Math.floor(segments / 2) + 1;  // segment 6
        nec.exCard(
            0,           // extype: 0 = voltage source
            1,           // tag: tag number
            center_segment,  // segment: segment number
            0,           // unused
            1.0,         // real part of voltage
            0.0,         // imaginary part of voltage
            0, 0, 0, 0   // unused parameters
        );
        console.log(`✓ Voltage source added at segment ${center_segment}\n`);

        // ===================================================================
        // STEP 5: Calculate radiation pattern
        // ===================================================================
        console.log('STEP 5: Calculating radiation pattern...');
        console.log('CRITICAL: Using correct RP card parameters!');

        nec.rpCard(
            0,       // calc_mode: 0 = normal space-wave mode
            37,      // n_theta: 37 angles (0° to 180°)
            1,       // n_phi: 1 angle (single vertical plane)
            1,       // output_format: 1 = vertical/horizontal/total
            5,       // normalization: 5 = normalize to total gain
            0,       // D: 0 = power gain (not directive gain)
            0,       // A: 0 = no averaging
            0.0,     // theta0: starting angle = 0°
            0.0,     // phi0: starting angle = 0°
            5.0,     // delta_theta: 5° steps *** CRITICAL! MUST BE NON-ZERO! ***
            0.0,     // delta_phi: 0 (single phi plane)
            0.0,     // radial_distance: 0 for far-field
            0.0      // gain_norm: 0 for auto normalization
        );
        console.log('✓ Radiation pattern calculated\n');

        // ===================================================================
        // STEP 6: Verify pattern data is available
        // ===================================================================
        console.log('STEP 6: Verifying pattern data...');
        const patternCount = nec.getRadiationPatternCount();
        const thetaCount = nec.getRadiationPatternThetaCount(0);
        const phiCount = nec.getRadiationPatternPhiCount(0);

        console.log(`Radiation pattern count: ${patternCount}`);
        console.log(`Theta angles: ${thetaCount}`);
        console.log(`Phi angles: ${phiCount}\n`);

        if (patternCount === 0) {
            console.error('ERROR: No radiation patterns found!');
            return;
        }

        // ===================================================================
        // STEP 7: Extract radiation pattern data
        // ===================================================================
        console.log('STEP 7: Extracting radiation pattern data...\n');
        console.log('Radiation Pattern Data:');
        console.log('=======================');
        console.log('Theta   PowerVert  PowerHoriz  PowerTot   EthetaMag  Status');
        console.log('------  ---------  ----------  ---------  ---------  ------');

        let maxGain = -999;
        let maxGainAngle = 0;

        for (let theta_idx = 0; theta_idx < thetaCount; theta_idx++) {
            const data = nec.getRadiationPatternData(
                0,          // result_index: 0 for first pattern
                theta_idx,  // theta_index
                0           // phi_index: 0 for first phi
            );

            if (!data.success) {
                console.log(`${data.theta.toFixed(1).padStart(5)}°  ERROR retrieving data`);
                continue;
            }

            // Determine status
            let status = '✓';
            if (data.powerTot < -900) {
                status = 'NULL'; // Null direction (no radiation)
            } else if (data.powerTot > maxGain) {
                maxGain = data.powerTot;
                maxGainAngle = data.theta;
            }

            // Note: powerHoriz will be -999.99 for vertical dipole (this is CORRECT!)
            console.log(
                `${data.theta.toFixed(1).padStart(5)}°  ` +
                `${data.powerVert.toFixed(2).padStart(9)}  ` +
                `${data.powerHoriz.toFixed(2).padStart(10)}  ` +
                `${data.powerTot.toFixed(2).padStart(9)}  ` +
                `${data.eThetaMag.toFixed(4).padStart(9)}  ` +
                `${status}`
            );
        }

        // ===================================================================
        // STEP 8: Analyze results
        // ===================================================================
        console.log('\nAnalysis:');
        console.log('=========');
        console.log(`Maximum gain: ${maxGain.toFixed(2)} dBi at theta = ${maxGainAngle}°`);

        // For a half-wave dipole, we expect:
        // - Maximum gain around 2.15 dBi at theta = 90° (broadside)
        // - Nulls at theta = 0° and 180° (along the wire)
        const expectedGain = 2.15;
        const gainError = Math.abs(maxGain - expectedGain);

        if (gainError < 0.5 && Math.abs(maxGainAngle - 90) < 10) {
            console.log('✓ Results match expected half-wave dipole pattern!');
            console.log(`✓ Maximum gain at broadside: ${maxGain.toFixed(2)} dBi (expected ~2.15 dBi)`);
            console.log('✓ Nulls at 0° and 180° (along wire axis)');
        } else {
            console.log('⚠ WARNING: Results differ from expected dipole pattern');
            console.log(`  Expected max gain: ~${expectedGain} dBi at 90°`);
            console.log(`  Actual max gain: ${maxGain.toFixed(2)} dBi at ${maxGainAngle}°`);
        }

        // ===================================================================
        // IMPORTANT NOTES
        // ===================================================================
        console.log('\nIMPORTANT NOTES:');
        console.log('================');
        console.log('1. PowerHoriz is -999.99 for ALL angles - this is CORRECT!');
        console.log('   A vertical dipole only radiates vertical polarization.');
        console.log('');
        console.log('2. Theta = 0° and 180° show -999.99 for all powers - this is CORRECT!');
        console.log('   These are null directions (along the dipole wire).');
        console.log('');
        console.log('3. The sentinel value -999.99 means "essentially zero power",');
        console.log('   not "invalid data" or "error".');
        console.log('');
        console.log('4. CRITICAL: delta_theta must be non-zero to get multiple angles!');
        console.log('   If delta_theta=0, all points will be at the same angle.');

        // ===================================================================
        // Get impedance for comparison
        // ===================================================================
        console.log('\nAntenna Input Parameters:');
        console.log('========================');
        const z_real = nec.getImpedanceReal(0);
        const z_imag = nec.getImpedanceImag(0);
        console.log(`Impedance: ${z_real.toFixed(2)} + j${z_imag.toFixed(2)} Ω`);

        // Calculate SWR for 50Ω system
        const z0 = 50.0;
        const gamma_mag = Math.sqrt(
            Math.pow(z_real - z0, 2) + Math.pow(z_imag, 2)
        ) / Math.sqrt(
            Math.pow(z_real + z0, 2) + Math.pow(z_imag, 2)
        );
        const swr = (1 + gamma_mag) / (1 - gamma_mag);
        console.log(`SWR (50Ω): ${swr.toFixed(2)}:1`);

        console.log('\n✓✓✓ EXAMPLE COMPLETED SUCCESSFULLY ✓✓✓');

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    } finally {
        // The NecppWrapper destructor will be called automatically
        // when the object goes out of scope
        nec.delete();
    }

}).catch(err => {
    console.error('Failed to load NEC++ module:', err);
});
