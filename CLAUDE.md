# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NEC++ is a C++ implementation of NEC-2 antenna modeling software with WebAssembly support. It simulates electromagnetic radiation patterns using the Method of Moments. The project includes C/C++, Python, Ruby, and JavaScript (WASM) interfaces.

## Build Commands

### C++ Build (Primary method)
```bash
cp wasm/config.h src/config.h   # REQUIRED before every build (config.h is gitignored)
bash build_simple.sh            # Produces ./nec2++
```

### WASM Build (Requires Emscripten SDK)
```bash
source /path/to/emsdk/emsdk_env.sh  # Activate Emscripten
cd wasm && make                      # Produces necpp.js + necpp.wasm
```

### Running Simulations
```bash
./nec2++ -i testharness/data/example1.nec -o output.out           # C++
node wasm/nec_wasm.js -i testharness/data/example1.nec -o out.out # WASM
```

## Testing

```bash
# Quick validation - all 41 tests
bash test_all_wasm.sh

# Detailed testing from testharness/
cd testharness
make -f Makefile.wasm test_cpp     # Run all C++ tests
make -f Makefile.wasm test_wasm    # Run all WASM tests
make -f Makefile.wasm compare      # Compare with 1e-5 tolerance

# Compare two output files
python3 testharness/nec_compare.py file1.outcpp file2.outwasm --tolerance 1e-5
```

## Architecture

### Core Components (src/)
- **nec_context.cpp/h**: Main simulation engine - orchestrates the entire calculation pipeline
- **c_geometry.cpp/h**: Wire and patch geometry handling
- **nec_radiation_pattern.cpp/h**: Far-field radiation pattern computation
- **nec_ground.cpp/h**: Ground plane calculations (free space, perfect, finite, Sommerfeld)
- **matrix_algebra.cpp/h**: Linear algebra solver (Gaussian elimination, optional LAPACK)
- **libnecpp.h**: C API for language bindings
- **lib_getters.cpp**: Result extraction functions (gain, impedance, currents, patterns)
- **nec2cpp.cpp**: Command-line interface

### WASM Port (wasm/)
- **necpp_bindings.cpp**: JavaScript bindings using Emscripten Embind
- **nec_wasm.js**: Node.js CLI wrapper with NEC file parser
- **dist/**: NPM package with ES6 module exports

### NEC File Format
Card-based input format (like punch cards):
- **GW**: Wire geometry (tag, segments, coordinates, radius)
- **GE**: Geometry end (ground plane flag)
- **FR**: Frequency specification
- **EX**: Excitation (voltage/current sources)
- **GN**: Ground parameters
- **RP**: Radiation pattern request
- **XQ**: Execute calculation
- **EN**: End of file

### Simulation Lifecycle
1. Create `nec_context` → 2. Add geometry (GW, SP, etc.) → 3. Call `geometryComplete()` → 4. Set frequency (FR) → 5. Add excitation (EX) → 6. Execute (XQ or RP) → 7. Retrieve results → 8. Delete context

## Key Implementation Details

- **WITHOUT_LAPACK**: WASM uses built-in Gaussian elimination solver (no external LAPACK)
- **Error handling**: WASM wraps RP/NE/NH operations in try-catch for numerical edge cases
- **Default frequency**: XQ card auto-injects 299.8 MHz if no FR card present
- **Thread safety**: nec_context is not thread-safe (single-threaded design)

## Extending WASM Bindings

1. Add method to `NecppWrapper` class in `wasm/necpp_bindings.cpp`
2. Expose via `EMSCRIPTEN_BINDINGS` section
3. Rebuild WASM: `cd wasm && make clean && make`
4. Update `wasm/nec_wasm.js` CLI parser if needed
5. Add test file to `testharness/data/`

## Test Files

41 test files in `testharness/data/` covering dipoles, Yagi arrays, patches, helices, various ground conditions, and excitation types. All tests pass with numerical accuracy within 1e-5 relative tolerance.
