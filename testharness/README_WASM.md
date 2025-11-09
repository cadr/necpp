# NEC++ WASM Test Harness

## Quick Start

This test harness validates the WebAssembly port of NEC++ against the C++ reference implementation.

### Run Tests

```bash
# Test C++ version on all files
make -f Makefile.wasm test_cpp

# Test WASM version (simple cases)
make -f Makefile.wasm test_wasm

# Compare outputs
make -f Makefile.wasm compare

# View detailed help
make -f Makefile.wasm help
```

### With Docker (Recommended for Local Testing)

```bash
# Build and run all tests in Docker
./docker_test.sh
```

## Files

- `Makefile.wasm` - Enhanced Makefile for WASM testing
- `nec_compare.py` - Numerical comparison tool with tolerance checking
- `WASM_TESTING.md` - Complete documentation
- `Dockerfile` - Docker container for reproducible testing
- `docker_test.sh` - Automated Docker test runner

## Documentation

See [WASM_TESTING.md](WASM_TESTING.md) for:
- Complete setup instructions
- Test file descriptions
- Troubleshooting guide
- Performance benchmarks
- Future enhancements

## Tolerance

Default tolerance is **1e-5** (relative error) for double-precision comparisons.

## Status

- ✅ C++ version: Fully functional
- ✅ WASM build: Compiles successfully
- ⚠️  WASM tests: Limited API coverage (simple tests work)
- ✅ Comparison tool: Operational
- ✅ Docker support: Available

## Contributing

To add new tests or improvements:

1. Add test files to `data/`
2. Update `Makefile.wasm` test lists
3. Run tests: `make -f Makefile.wasm test_cpp`
4. Document any new features in `WASM_TESTING.md`
