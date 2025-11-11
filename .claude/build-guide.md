# Build Guide for Claude Code (Web Environment)

## Important: Environment Constraints

**Claude Code on the web has these limitations:**
- ❌ No Docker available
- ❌ No Emscripten SDK installed
- ✅ Node.js IS available (`/opt/node22/bin/node`)
- ✅ C++ compiler (g++) IS available
- ✅ Python 3 IS available

## Building C++ Version (WORKS)

### Prerequisites

The `config.h` file must exist in `src/` directory:

```bash
cp wasm/config.h src/config.h
```

This is CRITICAL - the build will fail without it.

### Build Command

```bash
bash build_simple.sh
```

This produces the `./nec2++` executable.

### Testing C++ Version

```bash
# Run a single test
./nec2++ -i testharness/data/example1.nec -o output.out

# Check output
head -30 output.out
```

## WASM Build (NOT AVAILABLE in web environment)

The WASM build requires Emscripten SDK which is not installed in Claude Code web environment.

**If Emscripten were available, the process would be:**

```bash
# Activate Emscripten (not available)
source /home/user/emsdk/emsdk_env.sh

# Build WASM
cd wasm
make
```

This would produce `necpp.js` and `necpp.wasm`.

## Testing Without Building WASM

Since we can't build WASM in the web environment, but the wasm_port branch already has built WASM files committed, you can:

```bash
# Check if WASM files exist
ls -lh wasm/necpp.js wasm/necpp.wasm

# Test with Node.js (if files exist)
cd wasm
node nec_wasm.js -i ../testharness/data/example1.nec -o output.outwasm
```

## Running Test Suite

### C++ Tests (Works)

```bash
# Build C++ version first
cp wasm/config.h src/config.h
bash build_simple.sh

# Run tests from testharness directory
cd testharness
make -f Makefile.wasm test_cpp
```

### WASM Tests (Requires pre-built files)

```bash
# Only works if necpp.js and necpp.wasm already exist
cd testharness
make -f Makefile.wasm test_wasm
```

## Common Issues

### Issue: config.h not found

```
fatal error: config.h: No such file or directory
```

**Solution:**
```bash
cp wasm/config.h src/config.h
```

### Issue: Emscripten not found

```
em++: command not found
```

**Solution:** This is expected in Claude Code web environment. You cannot build WASM, but you can:
- Work with C++ version
- Test with existing WASM files if they're committed
- Review and modify code
- Update documentation

### Issue: Build warnings

The build may show warnings like:
```
warning: format not a string literal and no format arguments
```

These are non-fatal and can be ignored.

## Workflow for Code Changes

1. **Make changes** to src/*.cpp or wasm/*.cpp files

2. **Build C++ to verify** (quick check):
   ```bash
   bash build_simple.sh
   ```

3. **Test C++ version**:
   ```bash
   ./nec2++ -i testharness/data/example1.nec -o test.out
   ```

4. **Document** that WASM build needed (but can't be done in web environment)

5. **Commit changes** with note about WASM testing needed

## Summary

In Claude Code web environment:
- ✅ Can build and test C++ version
- ✅ Can review and modify all code
- ✅ Can run Node.js scripts if WASM files exist
- ❌ Cannot build WASM (no Emscripten)
- ❌ Cannot use Docker

Always start with `cp wasm/config.h src/config.h` before building!
