# Claude Code Project Files

This directory contains context files for Claude Code to help understand and work with the NEC++ project.

## Files

* **project-context.md** - Comprehensive project overview, architecture, and technical details
* **quick-commands.md** - Quick reference for common commands and workflows
* **build-guide.md** - Build instructions for both C++ and WASM versions
* **wasm-implementation-notes.md** - WASM implementation details and history

## Quick Start for Claude Code

1. **Setup Emscripten (one-time):**
   ```bash
   # See .claude/commands/setup-emscripten.md for full instructions
   cd /home/user
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source /home/user/emsdk/emsdk_env.sh
   ```

2. **Building C++:**
   ```bash
   cp wasm/config.h src/config.h
   bash build_simple.sh
   ```

3. **Building WASM:**
   ```bash
   source /home/user/emsdk/emsdk_env.sh  # Activate Emscripten
   cd wasm
   make
   ```

4. **Testing:**
   ```bash
   # Run all WASM tests
   bash test_all_wasm.sh

   # Or run detailed tests from testharness
   cd testharness
   make -f Makefile.wasm test_wasm
   ```

5. **Important Notes:**
   - Emscripten SDK can be installed for WASM builds
   - Emscripten must be activated in each new terminal session
   - Node.js is available for running tests
   - config.h must be copied from wasm/ to src/ before C++ builds
   - See `.claude/commands/setup-emscripten.md` for detailed Emscripten setup

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
