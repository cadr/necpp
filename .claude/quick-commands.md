# Quick Command Reference

## Building

```bash
# Build C++ version (simple method)
bash build_simple.sh

# Build WASM version
cd wasm
source /home/user/emsdk/emsdk_env.sh
make

# Clean WASM build
cd wasm && make clean
```

## Testing

```bash
# All commands from testharness/ directory
cd testharness

# Run C++ tests
make -f Makefile.wasm test_cpp

# Run WASM tests
make -f Makefile.wasm test_wasm

# Compare outputs
make -f Makefile.wasm compare

# Generate detailed report
make -f Makefile.wasm report

# Clean test outputs
make -f Makefile.wasm clean

# Docker testing
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

## Common Issues

```bash
# Emscripten not found
source /home/user/emsdk/emsdk_env.sh

# Build artifacts in git
# (Already handled in .gitignore: m4/, config/m4/, nec2++, *.outwasm)

# Clean everything
make -f Makefile.wasm clean
cd ../wasm && make clean
cd .. && rm -f nec2++
```
