# NEC++ Project Context

## Project Overview

**NEC++ (Numerical Electromagnetics Code)** is a C++ implementation of the NEC2 antenna modeling software. This project includes:

- C++ port of FORTRAN NEC2 code
- WebAssembly (WASM) port for browser/Node.js execution
- Python bindings
- Ruby bindings
- Comprehensive test harness

## Key Directories

```
necpp/
├── src/                    # C++ source code (core library)
│   ├── nec_context.cpp    # Main simulation context
│   ├── nec2cpp.cpp        # Command-line interface
│   ├── libnecpp.h         # C API header
│   └── *.cpp              # Core electromagnetic simulation code
│
├── wasm/                   # WebAssembly port
│   ├── necpp_bindings.cpp # JavaScript bindings (Embind)
│   ├── nec_wasm.js        # Node.js CLI wrapper
│   ├── Makefile           # Emscripten build
│   └── config.h           # WASM-specific config
│
├── testharness/           # Testing framework
│   ├── data/              # 41 NEC test files (.nec)
│   ├── Makefile.wasm      # WASM test automation
│   ├── nec_compare.py     # Numerical comparison tool
│   ├── WASM_TESTING.md    # Test documentation
│   └── docker_test.sh     # Docker testing
│
├── python/                # Python bindings (PyNEC)
├── Ruby/                  # Ruby bindings
└── example/               # Example NEC files

```

## Build System

### Current Status (as of Nov 2025)

- **Autotools**: Partially broken (requires Fortran compiler)
- **Simple Build**: Use `build_simple.sh` (C++ only, no dependencies)
- **WASM Build**: Use `wasm/Makefile` with Emscripten

### Building C++ Version

```bash
# Simple method (recommended)
bash build_simple.sh
# Produces: ./nec2++

# Traditional method (if autotools work)
./configure --with-bounds --without-lapack
make
```

### Building WASM Version

```bash
cd wasm
source /home/user/emsdk/emsdk_env.sh
make
# Produces: necpp.js and necpp.wasm
```

## Key Components

### 1. NEC File Format

NEC files use a card-based format (like punch cards):

- **CM/CE**: Comments
- **GW**: Wire geometry (tag, segments, coordinates, radius)
- **GE**: Geometry end (ground plane flag)
- **FR**: Frequency (mode, count, start MHz, step)
- **EX**: Excitation (type, tag, segment, voltage/current)
- **GN**: Ground parameters (type, radials, permittivity, conductivity)
- **LD**: Loading (type, tag, range, impedance)
- **TL/NT**: Transmission lines and networks
- **RP**: Radiation pattern (calc mode, theta/phi points)
- **NE/NH**: Near electric/magnetic fields
- **XQ**: Execute calculation
- **EN**: End of file

### 2. Core C++ Classes

- `nec_context`: Main simulation engine
- `c_geometry`: Geometry handling (wires, patches)
- `nec_ground`: Ground plane calculations
- `nec_radiation_pattern`: Radiation pattern computation
- `nec_output`: Output formatting
- `matrix_algebra`: Linear algebra (without LAPACK)

### 3. WASM API (Limited)

Current bindings expose:
- ✅ Geometry: `wire()`, `spCard()`, `gxCard()`, `geometryComplete()`
- ✅ Setup: `frCard()`, `exCard()`, `gnCard()`, `ldCard()`, `tlCard()`, `ntCard()`
- ✅ Pattern: `rpCard()` (partial - has issues)
- ✅ Results: `getGainMax/Min/Mean()`, `getImpedance*()`
- ❌ Missing: `xqCard()`, `ptCard()`, `pqCard()`, `neCard()`, `nhCard()`, etc.

## Testing

### Test Files Location

`testharness/data/*.nec` - 41 test files covering:
- Simple antennas (dipoles, monopoles)
- Arrays (Yagi, collinear)
- Complex geometries (patches, helices)
- Ground conditions (perfect, imperfect, Sommerfeld)
- Excitation types (voltage, current, plane wave)

### Running Tests

```bash
cd testharness

# C++ tests (all 41 files)
make -f Makefile.wasm test_cpp

# WASM tests (2 simple files currently work)
make -f Makefile.wasm test_wasm

# Compare outputs with 1e-5 tolerance
make -f Makefile.wasm compare

# Docker testing (reproducible)
./docker_test.sh
```

### Comparison Tool

```bash
python3 nec_compare.py file1.outcpp file2.outwasm --tolerance 1e-5
```

Options:
- `--tolerance`: Set relative error threshold (default: 1e-5)
- `--key-only`: Compare only gain/impedance
- `--verbose`: Show detailed differences

## Common Tasks

### Adding a New Test

1. Create `testharness/data/yourtest.nec`
2. Add to `SIMPLE_TESTS` or `RP_TESTS` in `Makefile.wasm`
3. Run: `make -f Makefile.wasm test_cpp`
4. Verify output in `data/yourtest.outcpp`

### Extending WASM Bindings

1. Add method to `NecppWrapper` class in `wasm/necpp_bindings.cpp`
2. Expose via `EMSCRIPTEN_BINDINGS` section
3. Rebuild: `cd wasm && make clean && make`
4. Update `wasm/nec_wasm.js` to use new function

### Debugging Issues

**C++ crashes:**
```bash
# Build with debug symbols
g++ -g -O0 -DDEBUG ...
gdb ./nec2++
```

**WASM errors:**
```bash
# Check browser console or Node.js output
node --inspect wasm/nec_wasm.js -i test.nec
```

**Test failures:**
```bash
# Verbose comparison
python3 testharness/nec_compare.py --verbose file1 file2

# Check individual card processing
./nec2++ -i test.nec -o test.out 2>&1 | grep "card("
```

## Dependencies

### C++ Build
- g++ with C++11 support
- Standard library only (no LAPACK, no Fortran)
- Optional: autotools (for full build)

### WASM Build
- Emscripten SDK (latest)
- Node.js 14+ (for testing)
- Python 3 (for comparison tool)

### Testing
- Python 3.6+
- Docker (optional, for reproducible testing)

## Known Issues

1. **Autotools**: Requires Fortran compiler (gfortran not installed)
   - **Solution**: Use `build_simple.sh`

2. **WASM RP Cards**: Division by zero errors
   - **Cause**: Missing card sequence handling
   - **Status**: Framework ready, needs API extension

3. **Output Format**: WASM differs from C++
   - **Solution**: Use numerical comparison tool

## Performance

Typical benchmarks (example1.nec, 7 segments):
- C++: ~50-100ms
- WASM: ~100-200ms (2x slower)
- Overhead: ~50ms WASM initialization

Large models (>1000 segments):
- C++: 1-5 seconds
- WASM: 2-10 seconds (1.5-2.5x slower)

## References

- [NEC2 Manual](http://www.nec2.org/)
- [Original NEC++ Repo](https://github.com/tmolteno/necpp)
- [Emscripten Docs](https://emscripten.org/docs/)
- Test documentation: `testharness/WASM_TESTING.md`

## Recent Work (Nov 2025)

Added comprehensive WASM test harness:
- Node.js CLI wrapper for WASM
- Python comparison tool (1e-5 tolerance)
- Automated testing framework
- Docker support
- Full documentation

**Status**: C++ fully functional (41/41 tests), WASM needs API extensions (2/41 tests pass)
