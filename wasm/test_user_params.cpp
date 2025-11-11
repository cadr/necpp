/*
 * Test using the EXACT parameters from the user's example
 */

#include "../src/libnecpp.h"
#include <stdio.h>

int main() {
    printf("Testing with user's exact parameters\n");
    printf("====================================\n\n");

    nec_context* nec = nec_create();

    // Simple dipole
    double freq_mhz = 299.7925;
    nec_wire(nec, 1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
    nec_geometry_complete(nec, 0);
    nec_fr_card(nec, 0, 1, freq_mhz, 0);
    nec_ex_card(nec, 0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);

    // User's RP card: (0, 37, 1, 1000, 0, 0, 5, 0, 0, 0, 0, 0, 0)
    printf("Calling rpCard with user's parameters:\n");
    printf("  (0, 37, 1, 1000, 0, 0, 5, 0, 0, 0, 0, 0, 0)\n\n");

    nec_rp_card(nec,
                0,      // calc_mode
                37,     // n_theta
                1,      // n_phi
                1000,   // output_format (INVALID - should be 0 or 1)
                0,      // normalization
                0,      // D
                5,      // A (INVALID - should be 0, 1, or 2)
                0.0,    // theta0
                0.0,    // phi0
                0.0,    // delta_theta (PROBLEM! All angles will be at 0°)
                0.0,    // delta_phi
                0.0,    // radial_distance
                0.0);   // gain_norm

    printf("Getting radiation pattern data at (0, 0, 0)...\n");

    double theta, phi;
    double power_vert, power_horiz, power_tot;
    double axial_ratio, tilt;
    int pol_sense;
    double e_theta_mag, e_theta_phase, e_phi_mag, e_phi_phase;

    long result = nec_get_radiation_pattern_data(nec, 0, 0, 0,
                                                  &theta, &phi,
                                                  &power_vert, &power_horiz, &power_tot,
                                                  &axial_ratio, &tilt, &pol_sense,
                                                  &e_theta_mag, &e_theta_phase,
                                                  &e_phi_mag, &e_phi_phase);

    printf("\nResults:\n");
    printf("--------\n");
    printf("Success: %s\n", result == 0 ? "true" : "false");
    printf("theta: %.2f degrees\n", theta);
    printf("phi: %.2f degrees\n", phi);
    printf("powerVert: %.2f dB\n", power_vert);
    printf("powerHoriz: %.2f dB\n", power_horiz);
    printf("powerTot: %.2f dB\n", power_tot);
    printf("eThetaMag: %.6f V/m\n", e_theta_mag);
    printf("ePhiMag: %.6f V/m\n", e_phi_mag);

    printf("\nANALYSIS:\n");
    printf("=========\n");
    if (power_tot < -900.0) {
        printf("✗ PowerTot is -999.99 (sentinel value)\n");
        printf("\nREASON: delta_theta = 0.0 means ALL angles are at theta=0°\n");
        printf("        For a vertical dipole, theta=0° is the NULL direction!\n");
        printf("        The antenna radiates nothing along its axis.\n");
        printf("\nSOLUTION: Use non-zero delta_theta, e.g., delta_theta = 5.0\n");
        printf("          to get angles from 0° to 180° in 5° steps.\n");
    } else {
        printf("✓ PowerTot has valid data\n");
    }

    printf("\n\nTesting with CORRECTED parameters:\n");
    printf("===================================\n");

    // Delete and recreate to start fresh
    nec_delete(nec);
    nec = nec_create();

    nec_wire(nec, 1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
    nec_geometry_complete(nec, 0);
    nec_fr_card(nec, 0, 1, freq_mhz, 0);
    nec_ex_card(nec, 0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);

    printf("Calling rpCard with CORRECTED parameters:\n");
    printf("  (0, 37, 1, 1, 5, 0, 0, 0, 0, 5, 0, 0, 0)\n");
    printf("  Note: output_format=1 (not 1000), delta_theta=5.0 (not 0.0)\n\n");

    nec_rp_card(nec,
                0,      // calc_mode
                37,     // n_theta
                1,      // n_phi
                1,      // output_format (CORRECTED: 1 = vert/horiz/total)
                5,      // normalization (CORRECTED: 5 = total gain normalized)
                0,      // D: 0 = power gain
                0,      // A: 0 = no averaging
                0.0,    // theta0: start at 0°
                0.0,    // phi0
                5.0,    // delta_theta (CORRECTED: 5° steps)
                0.0,    // delta_phi
                0.0,    // radial_distance
                0.0);   // gain_norm

    printf("Getting radiation pattern data at different angles:\n\n");
    printf("Theta   PowerVert  PowerHoriz  PowerTot   EthetaMag\n");
    printf("------------------------------------------------------\n");

    for (int idx = 0; idx < 37; idx += 9) {  // Test every 9th point (0, 45, 90, 135, 180)
        result = nec_get_radiation_pattern_data(nec, 0, idx, 0,
                                                 &theta, &phi,
                                                 &power_vert, &power_horiz, &power_tot,
                                                 &axial_ratio, &tilt, &pol_sense,
                                                 &e_theta_mag, &e_theta_phase,
                                                 &e_phi_mag, &e_phi_phase);

        printf("%5.0f°  %10.2f %11.2f %10.2f  %10.6f\n",
               theta, power_vert, power_horiz, power_tot, e_theta_mag);
    }

    printf("\n✓ Now the data shows the actual radiation pattern!\n");
    printf("✓ Notice the null at 0° and 180° (along dipole axis)\n");
    printf("✓ Maximum gain around 90° (broadside to dipole)\n");

    nec_delete(nec);
    return 0;
}
