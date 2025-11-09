# Quick Command Reference

## Building

```bash
# Build C++ version (simple method)
bash build_simple.sh

# FIRST TIME: Install Emscripten (if /home/user/emsdk doesn't exist)
cd /home/user
git clone --depth 1 https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest

# EVERY SESSION: Activate Emscripten before building WASM
source /home/user/emsdk/emsdk_env.sh

# Build WASM version
cd /home/user/necpp/wasm
make

# Clean WASM build
cd wasm && make clean

# Fix config.h if C++ build fails
cp wasm/config.h src/config.h
```

## Testing

```bash
# QUICK: Run all 41 WASM tests (from project root)
bash test_all_wasm.sh
# Expected: 41/41 passed, 0 failed (100%)

# DETAILED: From testharness/ directory
cd testharness

# Run C++ tests (all 41 files)
make -f Makefile.wasm test_cpp

# Run WASM tests (all 41 files)
make -f Makefile.wasm test_wasm

# Compare outputs with numerical tolerance
make -f Makefile.wasm compare

# Generate detailed report
make -f Makefile.wasm report

# Clean test outputs
make -f Makefile.wasm clean

# Docker testing (reproducible environment)
./docker_test.sh
```

## Running Simulations

```bash
# C++ version
./nec2++ -i input.nec -o output.out

# WASM version
cd wasm
node nec_wasm.js -i ../testharness/data/example1.nec -o output.outwasm
```

## Comparison

```bash
# Compare two output files
python3 testharness/nec_compare.py file1.outcpp file2.outwasm

# With custom tolerance
python3 testharness/nec_compare.py file1.out file2.out --tolerance 1e-6

# Key results only
python3 testharness/nec_compare.py file1.out file2.out --key-only

# Verbose mode
python3 testharness/nec_compare.py file1.out file2.out --verbose
```

## Git Workflow

```bash
# Current branch
git status

# Stage changes
git add <files>

# Commit (without signing due to service issues)
git -c commit.gpgsign=false commit -m "message"

# Push to remote
git push
```

## Debugging

```bash
# Check WASM build
cd wasm
node test_build.js

# Run with debug output
./nec2++ -i test.nec -o test.out 2>&1 | tee debug.log

# Check which cards are processed
./nec2++ -i test.nec -o test.out 2>&1 | grep "card("
```

## File Locations

```bash
# Test files
ls testharness/data/*.nec

# C++ binary
ls -lh nec2++

# WASM output
ls -lh wasm/necpp.{js,wasm}

# Test outputs
ls -lh testharness/data/*.out*

# Documentation
ls testharness/*.md
```

## Common Issues & Fixes

```bash
# ERROR: Emscripten not found / em++ command not found
source /home/user/emsdk/emsdk_env.sh

# ERROR: config.h: No such file or directory
cp wasm/config.h src/config.h

# ERROR: cannot find necpp.js module
# Make sure you're in correct directory when running node
cd /home/user/necpp
node wasm/nec_wasm.js -i testharness/data/example1.nec -o output.out

# Build artifacts in git
# (Already handled in .gitignore: m4/, config/m4/, nec2++, *.outwasm)

# Clean everything
cd /home/user/necpp
make -f testharness/Makefile.wasm clean
cd wasm && make clean
cd .. && rm -f nec2++
```
