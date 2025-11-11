/*
 * Test for radiation pattern data extraction
 * This test reproduces the issue reported where getRadiationPatternData returns sentinel values
 */

#include "../src/libnecpp.h"
#include <stdio.h>
#include <math.h>

int main() {
    printf("Radiation Pattern Data Extraction Test\n");
    printf("=======================================\n\n");

    // Create context
    nec_context* nec = nec_create();
    if (!nec) {
        printf("ERROR: Failed to create context\n");
        return 1;
    }
    printf("✓ Context created\n");

    // Define a simple half-wave dipole at 299.7925 MHz (as in user's example)
    double frequency = 299.7925;  // MHz
    double wavelength = 300.0 / frequency;  // approximately 1.0007 meters
    double wire_length = wavelength / 2.0;   // half-wave
    double wire_radius = 0.001; // meters (1mm)
    int segments = 11;

    printf("Creating dipole: length=%.4f m, radius=%.4f m, segments=%d\n",
           wire_length, wire_radius, segments);

    nec_wire(nec, 1, segments,
             0, 0, -wire_length/2,  // start point
             0, 0, wire_length/2,   // end point
             wire_radius, 1.0, 1.0);
    printf("✓ Wire defined\n");

    // Complete geometry
    nec_geometry_complete(nec, 0);
    printf("✓ Geometry complete\n");

    // Set frequency
    nec_fr_card(nec, 0, 1, frequency, 0);
    printf("✓ Frequency set to %.4f MHz\n", frequency);

    // Add excitation (voltage source at center)
    int center_segment = (segments / 2) + 1;
    nec_ex_card(nec, 0, 1, center_segment, 0, 1.0, 0.0, 0, 0, 0, 0);
    printf("✓ Excitation added at segment %d\n", center_segment);

    // Calculate radiation pattern
    // Parameters match user's example: (0, 37, 1, 1000, 0, 0, 5, 0, 0, 0, 0, 0, 0)
    // But we'll use simpler parameters first: 37 theta angles from 0 to 180 degrees
    printf("\nCalculating radiation pattern...\n");
    nec_rp_card(nec,
                0,      // calc_mode: normal mode
                37,     // n_theta: 37 angles
                1,      // n_phi: 1 angle
                1,      // output_format: 1 = vertical/horizontal/total
                0,      // normalization: 0 = no normalization
                0,      // D: 0 = power gain
                0,      // A: 0 = no averaging
                0.0,    // theta0: starting theta (degrees)
                0.0,    // phi0: starting phi (degrees)
                5.0,    // delta_theta: 5 degree steps (0 to 180 = 37 steps)
                0.0,    // delta_phi
                0.0,    // radial_distance
                0.0);   // gain_norm
    printf("✓ RP card executed\n");

    // Check radiation pattern count
    int rp_count = nec_get_radiation_pattern_count(nec);
    printf("\nRadiation pattern count: %d\n", rp_count);

    if (rp_count == 0) {
        printf("ERROR: No radiation patterns found!\n");
        nec_delete(nec);
        return 1;
    }

    // Get pattern dimensions
    int theta_count = nec_get_radiation_pattern_theta_count(nec, 0);
    int phi_count = nec_get_radiation_pattern_phi_count(nec, 0);
    printf("Theta count: %d\n", theta_count);
    printf("Phi count: %d\n", phi_count);

    // Test getting data at different angles
    printf("\n");
    printf("Testing radiation pattern data extraction:\n");
    printf("------------------------------------------\n");
    printf("Theta   Phi   PowerVert PowerHoriz PowerTot  EthetaMag  EphiMag\n");
    printf("---------------------------------------------------------------------\n");

    bool has_valid_data = false;
    int test_points[] = {0, 9, 18};  // Test at 0°, 45°, and 90° (indices 0, 9, 18)

    for (int i = 0; i < 3; i++) {
        int theta_idx = test_points[i];
        int phi_idx = 0;

        double theta, phi;
        double power_vert, power_horiz, power_tot;
        double axial_ratio, tilt;
        int pol_sense;
        double e_theta_mag, e_theta_phase, e_phi_mag, e_phi_phase;

        long result = nec_get_radiation_pattern_data(nec, 0, theta_idx, phi_idx,
                                                      &theta, &phi,
                                                      &power_vert, &power_horiz, &power_tot,
                                                      &axial_ratio, &tilt, &pol_sense,
                                                      &e_theta_mag, &e_theta_phase,
                                                      &e_phi_mag, &e_phi_phase);

        printf("%5.1f %5.1f %10.2f %10.2f %10.2f %10.4f %10.4f ",
               theta, phi, power_vert, power_horiz, power_tot, e_theta_mag, e_phi_mag);

        if (result == 0) {
            printf("✓");
            // Check if data is valid (not sentinel values)
            if (power_tot > -900.0 && e_theta_mag > 0.0) {
                has_valid_data = true;
            } else {
                printf(" [SENTINEL VALUES!]");
            }
        } else {
            printf("✗ ERROR");
        }
        printf("\n");
    }

    printf("\n");

    // Also test the simplified gain functions for comparison
    printf("Testing simplified gain API:\n");
    printf("----------------------------\n");
    double gain_max = nec_gain_max(nec, 0);
    double gain_min = nec_gain_min(nec, 0);
    double gain_mean = nec_gain_mean(nec, 0);

    printf("Maximum Gain: %.2f dBi\n", gain_max);
    printf("Minimum Gain: %.2f dBi\n", gain_min);
    printf("Mean Gain:    %.2f dBi\n", gain_mean);

    bool simplified_api_works = (gain_max > -900.0);

    printf("\n");
    printf("Test Summary:\n");
    printf("=============\n");
    printf("Simplified API (nec_gain_max, etc.): %s\n",
           simplified_api_works ? "✓ WORKS" : "✗ FAILS");
    printf("Detailed API (nec_get_radiation_pattern_data): %s\n",
           has_valid_data ? "✓ WORKS" : "✗ FAILS - Returns sentinel values");

    // Clean up
    nec_delete(nec);

    if (has_valid_data) {
        printf("\n✓✓✓ TEST PASSED ✓✓✓\n");
        return 0;
    } else {
        printf("\n✗✗✗ TEST FAILED - Radiation pattern data returns sentinel values ✗✗✗\n");
        return 1;
    }
}
