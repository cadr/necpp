# NEC++ WASM Port Testing Guide

This document describes how to test the WebAssembly port of NEC++ against the C++ reference implementation.

## Overview

The WASM test harness compares numerical outputs from the NEC++ WebAssembly port against the C++ version to ensure fidelity. Comparisons use double-precision relative tolerances (~1e-5) to account for floating-point rounding differences.

## Quick Start

### Prerequisites

- Node.js (v14 or later)
- Python 3 (for comparison tool)
- Emscripten SDK (for building WASM)
- C++ compiler (g++)

### Building

```bash
# 1. Build the C++ version
cd /home/user/necpp
bash build_simple.sh

# 2. Build the WASM version
cd wasm
source /home/user/emsdk/emsdk_env.sh
make

# 3. Navigate to test harness
cd ../testharness
```

### Running Tests

```bash
# Run C++ tests on all test files
make -f Makefile.wasm test_cpp

# Run WASM tests on simple cases
make -f Makefile.wasm test_wasm

# Compare WASM vs C++ outputs
make -f Makefile.wasm compare

# Generate detailed report
make -f Makefile.wasm report

# Clean test outputs
make -f Makefile.wasm clean
```

## Test Files

### Test Data Location

Test files are located in `testharness/data/` and include:

- **Simple tests** (geometry only, no radiation patterns):
  - `example1.nec` - Center-fed linear antenna
  - `herzian_dipole.nec` - Hertzian dipole with near fields

- **Complex tests** (with radiation patterns):
  - `example3.nec` - Vertical half-wave antenna over ground
  - `example4.nec` - Multiple frequency analysis
  - `yagi.nec` - Yagi antenna array

### Test Categories

1. **Geometry Tests**: Wire structures, surface patches, reflections
2. **Excitation Tests**: Voltage sources, current sources, plane waves
3. **Ground Tests**: Perfect ground, imperfect ground, Sommerfeld
4. **Pattern Tests**: Radiation patterns, near fields
5. **Network Tests**: Transmission lines, networks, loads

## Comparison Tool

### Usage

```bash
# Full comparison (all numerical values)
python3 nec_compare.py file1.outcpp file2.outwasm --tolerance 1e-5

# Key results only (gain, impedance)
python3 nec_compare.py file1.outcpp file2.outwasm --key-only

# Verbose mode
python3 nec_compare.py file1.outcpp file2.outwasm --verbose
```

### Tolerance Settings

The default tolerance is `1e-5` (relative error), which accounts for:
- Double-precision floating-point rounding
- Minor algorithmic differences
- Platform-specific math library variations

For stricter comparison, use `--tolerance 1e-6`.
For more lenient comparison, use `--tolerance 1e-4`.

## Current Status

### Working Features ✓

- **C++ Version**: Fully functional for all test cases
- **WASM Build**: Successfully compiles with Emscripten
- **Basic API**: Wire geometry, frequency, excitation, ground
- **Test Framework**: Automated testing and comparison

### Known Limitations ⚠️

1. **WASM API Coverage**: Current bindings expose limited C API functions
   - Missing: XQ (execute), PT (print control), PQ (print control)
   - Missing: NE/NH (near field calculations)
   - Missing: CP (coupling), PL (plot)

2. **Complex Test Cases**: Tests with advanced features may not run in WASM
   - Radiation pattern calculations (RP card) have issues
   - Multiple frequency sweeps need validation
   - Network/transmission line features limited

3. **Output Format**: WASM output format differs from C++ version
   - Comparison tool focuses on numerical values
   - Structural output differences are expected

### Numerical Differences

Expected differences between WASM and C++ outputs:

1. **Floating-Point**: Up to ~1e-15 relative error due to:
   - Different math library implementations
   - WASM vs native floating-point handling
   - Compiler optimization differences

2. **Algorithm Variations**: Small differences may occur in:
   - Matrix solver convergence
   - Iterative calculations
   - Ground wave calculations

## Docker Support

### Building with Docker

A Dockerfile is provided for reproducible builds:

```bash
# Build Docker image
docker build -t necpp-wasm -f testharness/Dockerfile .

# Run C++ tests in Docker (outputs stay in container)
docker run --rm necpp-wasm make -f Makefile.wasm test_cpp

# Run WASM tests in Docker
docker run --rm necpp-wasm make -f Makefile.wasm test_wasm

# Run comparison
docker run --rm necpp-wasm make -f Makefile.wasm compare

# To copy test outputs to your host machine:
docker run --rm necpp-wasm tar -czf - testharness/data/*.out* 2>/dev/null | tar -xzf -
```

### Docker Image Contents

- Ubuntu 22.04 base
- Node.js 18.x
- Python 3
- Emscripten SDK
- Build tools (g++, make)

## Troubleshooting

### Emscripten Not Found

```bash
# Activate Emscripten
source /home/user/emsdk/emsdk_env.sh

# Or install
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
```

### WASM Runtime Errors

Common issues:

1. **"divide by zero"**: Card sequence issue - some cards must be called in specific order
2. **Memory errors**: Increase MAXIMUM_MEMORY in wasm/Makefile
3. **Missing methods**: Update WASM bindings to expose required API

### Comparison Failures

If comparisons fail:

1. Check tolerance setting (try `--tolerance 1e-4`)
2. Use `--verbose` to see which values differ
3. Use `--key-only` to compare only critical results
4. Verify both output files were generated successfully

## Adding New Tests

To add a new test case:

1. Place `.nec` file in `testharness/data/`
2. Add to appropriate test category in `Makefile.wasm`
3. Run: `make -f Makefile.wasm test_cpp`
4. Verify output in `data/yourtest.outcpp`

Example:

```makefile
# In Makefile.wasm
SIMPLE_TESTS := $(DATA_DIR)/example1.nec \
                $(DATA_DIR)/yourtest.nec
```

## Performance

### Benchmark Results

Typical performance (example1.nec, 7 segments):

- **C++ version**: ~50-100ms
- **WASM version**: ~100-200ms (2x slower)
- **Overhead**: WASM initialization adds ~50ms

Larger models (>1000 segments):

- **C++ version**: ~1-5 seconds
- **WASM version**: ~2-10 seconds
- **Ratio**: WASM typically 1.5-2.5x slower

## Future Enhancements

### High Priority

1. **Complete WASM Bindings**: Expose all C API functions
   - Add XQ, PT, PQ card support
   - Add NE, NH near-field calculations
   - Add complete error handling

2. **Output Compatibility**: Match C++ output format
   - Structured output generation
   - CSV/XML export support
   - Compatible with existing tools

3. **Full Test Coverage**: Run all 40+ test cases
   - Validate all geometry types
   - Test all excitation modes
   - Verify ground calculations

### Medium Priority

1. **Performance Optimization**
   - SIMD support where available
   - Memory pool optimization
   - Parallel calculation (Web Workers)

2. **Extended API**
   - Direct NEC file processing in WASM
   - Streaming output
   - Progress callbacks

3. **Documentation**
   - API reference
   - Code examples
   - Integration guides

### Low Priority

1. **Visualization**
   - WebGL geometry display
   - Interactive pattern plots
   - Real-time parameter adjustment

2. **Tools Integration**
   - NEC2 file format extensions
   - GUI wrapper
   - Cloud processing

## References

- [NEC2 Official Documentation](http://www.nec2.org/)
- [NEC++ GitHub Repository](https://github.com/tmolteno/necpp)
- [Emscripten Documentation](https://emscripten.org/docs/)
- [WebAssembly Specification](https://webassembly.org/)

## Contact

For issues or questions about the WASM port testing:

1. Check existing GitHub issues
2. Review this documentation
3. Examine test output logs
4. Create detailed bug report with:
   - Test file (.nec)
   - Expected vs actual output
   - Error messages
   - Environment details

## License

NEC++ is licensed under the GNU GPL v2. See LICENSE file for details.
