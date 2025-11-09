/*
 * Simple test program for NEC++ library
 * Tests basic functionality without WebAssembly
 */

#include "../src/libnecpp.h"
#include <stdio.h>
#include <math.h>

int main() {
    printf("NEC++ Library Test\n");
    printf("==================\n\n");

    // Create context
    printf("Creating NEC++ context...\n");
    nec_context* nec = nec_create();
    if (!nec) {
        printf("ERROR: Failed to create context\n");
        return 1;
    }
    printf("✓ Context created\n\n");

    // Define a simple half-wave dipole
    printf("Defining antenna geometry (half-wave dipole)...\n");
    double frequency = 299.8;  // MHz (1m wavelength)
    double wire_length = 0.5;   // meters
    double wire_radius = 0.001; // meters (1mm)
    int segments = 11;

    nec_wire(nec, 1, segments,
             0, 0, -wire_length/2,  // start point
             0, 0, wire_length/2,   // end point
             wire_radius, 1.0, 1.0);

    printf("✓ Wire defined: %.2f m length, %d segments\n\n", wire_length, segments);

    // Complete geometry
    printf("Completing geometry...\n");
    nec_geometry_complete(nec, 0);
    printf("✓ Geometry complete\n\n");

    // Set frequency
    printf("Setting frequency to %.1f MHz...\n", frequency);
    nec_fr_card(nec, 0, 1, frequency, 0);
    printf("✓ Frequency set\n\n");

    // Add excitation (voltage source at center)
    printf("Adding voltage excitation at center...\n");
    int center_segment = (segments / 2) + 1;
    nec_ex_card(nec, 0, 1, center_segment, 0, 1.0, 0.0, 0, 0, 0, 0);
    printf("✓ Excitation added at segment %d\n\n", center_segment);

    // Set ground (free space)
    printf("Setting ground parameters (free space)...\n");
    nec_gn_card(nec, -1, 0, 0, 0, 0, 0, 0, 0);
    printf("✓ Ground parameters set\n\n");

    // Calculate radiation pattern
    printf("Calculating radiation pattern...\n");
    nec_rp_card(nec, 0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);
    printf("✓ Radiation pattern calculated\n\n");

    // Get results
    printf("Results:\n");
    printf("--------\n");

    double gain_max = nec_gain_max(nec, 0);
    double gain_min = nec_gain_min(nec, 0);
    double gain_mean = nec_gain_mean(nec, 0);
    double z_real = nec_impedance_real(nec, 0);
    double z_imag = nec_impedance_imag(nec, 0);

    printf("Maximum Gain:  %.2f dBi\n", gain_max);
    printf("Minimum Gain:  %.2f dBi\n", gain_min);
    printf("Mean Gain:     %.2f dBi\n", gain_mean);
    printf("Impedance:     %.2f + j%.2f Ω\n", z_real, z_imag);

    // Calculate SWR
    double z0 = 50.0;
    double gamma_mag = sqrt(pow(z_real - z0, 2) + pow(z_imag, 2)) /
                       sqrt(pow(z_real + z0, 2) + pow(z_imag, 2));
    double swr = (1 + gamma_mag) / (1 - gamma_mag);
    printf("SWR (50Ω):     %.2f:1\n\n", swr);

    // Validate results
    printf("Validation:\n");
    printf("-----------\n");

    bool all_pass = true;

    // Half-wave dipole should have gain around 2.15 dBi
    if (gain_max > 1.5 && gain_max < 3.0) {
        printf("✓ Gain is in expected range (1.5 to 3.0 dBi)\n");
    } else {
        printf("✗ WARNING: Gain %.2f dBi is outside expected range\n", gain_max);
        all_pass = false;
    }

    // Impedance real part should be around 73Ω for half-wave dipole
    if (z_real > 50 && z_real < 90) {
        printf("✓ Real impedance is in expected range (50 to 90 Ω)\n");
    } else {
        printf("✗ WARNING: Real impedance %.2f Ω is outside expected range\n", z_real);
        all_pass = false;
    }

    // Imaginary part should be close to 0 for resonant dipole
    if (fabs(z_imag) < 50) {
        printf("✓ Imaginary impedance is in expected range (-50 to 50 Ω)\n");
    } else {
        printf("✗ WARNING: Imaginary impedance %.2f Ω is outside expected range\n", z_imag);
        all_pass = false;
    }

    // Clean up
    printf("\nCleaning up...\n");
    nec_delete(nec);
    printf("✓ Context deleted\n");

    if (all_pass) {
        printf("\n✓✓✓ ALL VALIDATIONS PASSED ✓✓✓\n");
        return 0;
    } else {
        printf("\n⚠ SOME VALIDATIONS FAILED ⚠\n");
        return 1;
    }
}
