/*
 * WebAssembly Compatibility Header for NEC++
 *
 * This header provides compatibility shims for platform-specific
 * functionality that is not available or needed in WebAssembly.
 */

#ifndef WASM_COMPAT_H
#define WASM_COMPAT_H

#ifdef __EMSCRIPTEN__

// Include Emscripten-specific headers
#include <emscripten.h>

// Timing function stub
// In WebAssembly, we provide a simple stub for the timing function
// since high-precision timing may not be available or needed
inline void secnds_wasm_stub(double* x) {
    // Return a dummy value - timing in WASM is handled differently
    // and typically done from JavaScript using performance.now()
    *x = 0.0;
}

// Signal handling is not applicable in WebAssembly
// These macros prevent signal-related code from being compiled
#define SIGINT 0
#define signal(sig, handler) ((void)0)

#else

// When not compiling for WebAssembly, use standard implementations
// (This header is only needed for WASM builds)

#endif // __EMSCRIPTEN__

#endif // WASM_COMPAT_H
