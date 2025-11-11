# Quick Command Reference

## Environment: Claude Code on Web

**Available:** ✅ C++ compiler, Node.js, Python 3, make, bash
**NOT Available:** ❌ Docker, Emscripten SDK, Fortran

## Building

```bash
# ALWAYS DO THIS FIRST (before any C++ build)
cp wasm/config.h src/config.h

# Build C++ version (WORKS in web environment)
bash build_simple.sh

# WASM build (NOT AVAILABLE in Claude Code web - requires Emscripten)
# If Emscripten were available:
# cd wasm && make

# Clean builds
rm -f nec2++ src/*.o
cd wasm && make clean
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
# ERROR: config.h: No such file or directory
# SOLUTION: This is the most common issue!
cp wasm/config.h src/config.h

# ERROR: Emscripten not found / em++ command not found
# SOLUTION: Expected in web environment - cannot build WASM
# Work with C++ version instead

# ERROR: cannot find necpp.js module
# SOLUTION: WASM files may not be built - build C++ version instead
./nec2++ -i testharness/data/example1.nec -o output.out

# Build artifacts in git
# Already handled in .gitignore: m4/, config/m4/, nec2++, *.outwasm, src/config.h

# Clean everything
rm -f nec2++
cd testharness && rm -f data/*.out*
cd ../wasm && make clean
```
