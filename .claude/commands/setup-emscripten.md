# Emscripten SDK Setup Command

Set up the Emscripten SDK for building the NEC++ WebAssembly port.

## Installation Instructions

Follow these steps to install and configure the Emscripten SDK:

### Step 1: Install Emscripten (One-time setup)

```bash
# Navigate to home directory
cd /home/user

# Clone the Emscripten SDK repository
git clone https://github.com/emscripten-core/emsdk.git

# Enter the emsdk directory
cd emsdk

# Download and install the latest SDK tools (takes several minutes)
./emsdk install latest

# Activate the latest SDK version
./emsdk activate latest

# Activate PATH and environment variables
source /home/user/emsdk/emsdk_env.sh
```

### Step 2: Verify Installation

```bash
# Check Emscripten compiler versions
em++ --version
emcc --version
```

Expected output: Version information for Emscripten compiler (e.g., "emcc (Emscripten gcc/clang-like replacement) 3.1.50")

### Step 3: Build WASM

```bash
# Navigate to the wasm directory
cd /home/user/necpp/wasm

# Build the WebAssembly module
make
```

This will generate:
- `necpp.js` - JavaScript glue code
- `necpp.wasm` - WebAssembly binary

## Important Notes

### Environment Activation

**CRITICAL:** You must activate the Emscripten environment in every new terminal session before building:

```bash
source /home/user/emsdk/emsdk_env.sh
```

### Automatic Activation (Optional)

To avoid running the source command manually each time, add it to your shell profile:

```bash
echo 'source /home/user/emsdk/emsdk_env.sh' >> ~/.bashrc
```

Then restart your terminal or run:
```bash
source ~/.bashrc
```

## Quick Command Reference

```bash
# Activate Emscripten (run this in each new terminal)
source /home/user/emsdk/emsdk_env.sh

# Build WASM
cd /home/user/necpp/wasm && make

# Build and run tests
cd /home/user/necpp/wasm && make && cd ../testharness && make -f Makefile.wasm test_wasm

# Clean WASM build
cd /home/user/necpp/wasm && make clean
```

## Testing Status

After proper Emscripten installation, the WASM build produces:
- **95% test success rate** (39/41 tests passing)
- **<0.03% numerical error** compared to C++ implementation
- Full validation of electromagnetic calculations (impedance, current, power)

## Troubleshooting

### Problem: `em++: command not found`

**Cause:** Emscripten environment not activated in current terminal.

**Solution:**
```bash
source /home/user/emsdk/emsdk_env.sh
```

### Problem: `emsdk: No such file or directory`

**Cause:** Emscripten SDK not installed.

**Solution:** Follow Step 1 above to install Emscripten.

### Problem: Build fails with compilation errors

**Cause:** May need to rebuild from clean state or update Emscripten.

**Solution:**
```bash
# Clean and rebuild
cd /home/user/necpp/wasm
make clean
source /home/user/emsdk/emsdk_env.sh
make
```

### Problem: Tests fail or show errors

**Cause:** WASM files may be out of date or not built correctly.

**Solution:**
```bash
# Rebuild C++ and WASM versions
cd /home/user/necpp
bash build_simple.sh
cd wasm
source /home/user/emsdk/emsdk_env.sh
make clean && make
cd ../testharness
make -f Makefile.wasm clean
make -f Makefile.wasm test_cpp
make -f Makefile.wasm test_wasm
make -f Makefile.wasm compare
```

## See Also

- [wasm/QUICKSTART.md](../wasm/QUICKSTART.md) - Quick start guide for WASM
- [wasm/README.md](../wasm/README.md) - Complete WASM documentation
- [wasm/SETUP.md](../wasm/SETUP.md) - NPM package setup
- [testharness/WASM_TESTING.md](../testharness/WASM_TESTING.md) - Testing guide
