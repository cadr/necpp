# Claude Code Project Files

This directory contains context files for Claude Code to help understand and work with the NEC++ project.

## Files

* **project-context.md** - Comprehensive project overview, architecture, and technical details
* **quick-commands.md** - Quick reference for common commands and workflows
* **build-guide.md** - Build instructions for both C++ and WASM versions
* **wasm-implementation-notes.md** - WASM implementation details and history

## Quick Start for Claude Code

1. **Building C++:**
   ```bash
   cp wasm/config.h src/config.h
   bash build_simple.sh
   ```

2. **Testing:**
   ```bash
   # Tests work without WASM (Node.js available, no Emscripten in web environment)
   # C++ version can be built and tested
   ```

3. **Important Notes:**
   - Running in Claude Code web environment (no Docker available)
   - Emscripten SDK not installed (WASM builds not available)
   - Node.js IS available for testing
   - config.h must be copied from wasm/ to src/ before C++ builds

## Documentation Structure

### Root Level
- README.md - Main project README with WASM info
- INSTALL.md - Installation instructions
- DOCKER.md - Docker deployment guide

### WASM Documentation
- wasm/README.md - WASM build and usage guide
- wasm/USAGE.md - Complete API reference (889 lines!)
- wasm/QUICKSTART.md - Quick start guide
- wasm/dist/README.md - NPM package documentation

### Testing Documentation
- testharness/WASM_TESTING.md - Comprehensive testing guide
- testharness/IMPLEMENTATION_SUMMARY.md - Implementation details

## Key Architecture Points

### WASM Implementation
- **100% test coverage** - All 41 tests passing
- **Complete C API bindings** - All NEC card types supported
- **Full getter API** - Access to geometry, currents, patterns, near fields
- **Robust error handling** - Try-catch blocks for numerical issues

### Build System
- **C++ version**: Uses build_simple.sh (no autotools needed)
- **WASM version**: Uses Emscripten with Makefile in wasm/
- **Tests**: testharness/ has comprehensive test suite

### Code Organization
- **src/** - Core C++ electromagnetic simulation code
- **wasm/** - WebAssembly port with Embind bindings
- **testharness/** - 41 NEC test files and comparison tools
- **python/**, **Ruby/** - Language bindings
