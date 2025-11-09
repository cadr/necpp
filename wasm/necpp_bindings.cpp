/*
 * NEC++ WebAssembly Bindings
 *
 * This file provides JavaScript bindings for the NEC++ electromagnetic
 * simulation library using Emscripten's Embind.
 */

#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "../src/libnecpp.h"
#include "../src/nec_context.h"
#include <string>
#include <vector>

using namespace emscripten;

// Wrapper class to provide a cleaner JavaScript API
class NecppWrapper {
private:
    nec_context* ctx;

public:
    NecppWrapper() {
        ctx = nec_create();
    }

    ~NecppWrapper() {
        if (ctx) {
            nec_delete(ctx);
        }
    }

    // Geometry methods
    void wire(int tag_id, int seg_count,
              double xw1, double yw1, double zw1,
              double xw2, double yw2, double zw2,
              double rad, double rdel, double rrad) {
        nec_wire(ctx, tag_id, seg_count, xw1, yw1, zw1, xw2, yw2, zw2, rad, rdel, rrad);
    }

    void geometry_complete(int gpflag) {
        nec_geometry_complete(ctx, gpflag);
    }

    void sp_card(int ns, double x1, double y1, double z1, double x2, double y2, double z2) {
        nec_sp_card(ctx, ns, x1, y1, z1, x2, y2, z2);
    }

    void gx_card(int card_int, int int_param2) {
        nec_gx_card(ctx, card_int, int_param2);
    }

    // Ground parameters
    void gn_card(int iperf, int nradl, double epsr, double sig,
                 double tmp3, double tmp4, double tmp5, double tmp6) {
        nec_gn_card(ctx, iperf, nradl, epsr, sig, tmp3, tmp4, tmp5, tmp6);
    }

    // Frequency
    void fr_card(int in_ifrq, int in_nfrq, double in_freq_mhz, double in_del_freq) {
        nec_fr_card(ctx, in_ifrq, in_nfrq, in_freq_mhz, in_del_freq);
    }

    // Excitation
    void ex_card(int extype, int i2, int i3, int i4,
                 double f1r, double f2r, double f3r, double f4r,
                 double f5r, double f6r) {
        nec_ex_card(ctx, extype, i2, i3, i4, f1r, f2r, f3r, f4r, f5r, f6r);
    }

    // Loading
    void ld_card(int ldtyp, int ldtag, int ldtagf, int ldtagt,
                 double zlr, double zli, double zlc) {
        nec_ld_card(ctx, ldtyp, ldtag, ldtagf, ldtagt, zlr, zli, zlc);
    }

    // Transmission line
    void tl_card(int itmp1, int itmp2, int itmp3, int itmp4,
                 double tmp1, double tmp2, double tmp3, double tmp4,
                 double tmp5, double tmp6) {
        nec_tl_card(ctx, itmp1, itmp2, itmp3, itmp4, tmp1, tmp2, tmp3, tmp4, tmp5, tmp6);
    }

    // Network
    void nt_card(int itmp1, int itmp2, int itmp3, int itmp4,
                 double tmp1, double tmp2, double tmp3, double tmp4,
                 double tmp5, double tmp6) {
        nec_nt_card(ctx, itmp1, itmp2, itmp3, itmp4, tmp1, tmp2, tmp3, tmp4, tmp5, tmp6);
    }

    // Radiation pattern
    void rp_card(int calc_mode, int n_theta, int n_phi,
                 int output_format, int normalization, int D, int A,
                 double theta0, double phi0, double delta_theta, double delta_phi,
                 double radial_distance, double gain_norm) {
        nec_rp_card(ctx, calc_mode, n_theta, n_phi, output_format, normalization, D, A,
                   theta0, phi0, delta_theta, delta_phi, radial_distance, gain_norm);
    }

    // Results retrieval
    double get_gain_max(int freq_index) {
        return nec_gain_max(ctx, freq_index);
    }

    double get_gain_min(int freq_index) {
        return nec_gain_min(ctx, freq_index);
    }

    double get_gain_mean(int freq_index) {
        return nec_gain_mean(ctx, freq_index);
    }

    double get_gain_sd(int freq_index) {
        return nec_gain_sd(ctx, freq_index);
    }

    double get_impedance_real(int freq_index) {
        return nec_impedance_real(ctx, freq_index);
    }

    double get_impedance_imag(int freq_index) {
        return nec_impedance_imag(ctx, freq_index);
    }

    // Simplified gain access (the detailed radiation pattern functions
    // are not available in the C API, only in the C++ API)
    double get_gain(int freq_index, int theta_index, int phi_index) {
        return nec_gain(ctx, freq_index, theta_index, phi_index);
    }

    // Error handling
    std::string get_error_message() {
        const char* msg = nec_error_message();
        return msg ? std::string(msg) : std::string("");
    }
};

// Embind bindings
EMSCRIPTEN_BINDINGS(necpp_module) {
    class_<NecppWrapper>("NecppWrapper")
        .constructor<>()

        // Geometry
        .function("wire", &NecppWrapper::wire)
        .function("geometryComplete", &NecppWrapper::geometry_complete)
        .function("spCard", &NecppWrapper::sp_card)
        .function("gxCard", &NecppWrapper::gx_card)

        // Ground
        .function("gnCard", &NecppWrapper::gn_card)

        // Frequency
        .function("frCard", &NecppWrapper::fr_card)

        // Excitation
        .function("exCard", &NecppWrapper::ex_card)

        // Loading
        .function("ldCard", &NecppWrapper::ld_card)

        // Transmission line
        .function("tlCard", &NecppWrapper::tl_card)

        // Network
        .function("ntCard", &NecppWrapper::nt_card)

        // Radiation pattern
        .function("rpCard", &NecppWrapper::rp_card)

        // Results
        .function("getGainMax", &NecppWrapper::get_gain_max)
        .function("getGainMin", &NecppWrapper::get_gain_min)
        .function("getGainMean", &NecppWrapper::get_gain_mean)
        .function("getGainSd", &NecppWrapper::get_gain_sd)
        .function("getImpedanceReal", &NecppWrapper::get_impedance_real)
        .function("getImpedanceImag", &NecppWrapper::get_impedance_imag)
        .function("getGain", &NecppWrapper::get_gain)

        // Error handling
        .function("getErrorMessage", &NecppWrapper::get_error_message);
}
