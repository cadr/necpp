# WASM CLI Extension Implementation Plan

## Overview

Extend `/workspace/wasm/nec_wasm.js` to match the C++ CLI command-line options.

## Options to Add

| Option | Description | Implementation Notes |
|--------|-------------|---------------------|
| `-v` | Print version and exit | Print `nec2++ WASM VERSION` |
| `-s` | Output results to stdout | Write output to stdout instead of file |
| `-c` | CSV output format | Format results as CSV |
| `-x` | XML output format | Format results as XML |
| `-g` | Gain-only output | Only print maximum gain |
| `-b` | Benchmark | JS-based benchmark using WASM module |

## Key Changes Required

1. Update `parseArgs()` to handle new flags (-v, -s, -c, -x, -g, -b)
2. Add version constant and -v handler
3. Implement benchmark function using performance.now()
4. Add format parameter to OutputFormatter for CSV/XML
5. Implement gain-only mode that just outputs max gain
6. Update main execution logic to handle all modes
7. Modify processNecFile to optionally return output string for stdout mode

## Testing Approach

1. Test each new option in isolation
2. Run existing test suite (test_all_wasm.sh) to verify no regressions
3. Compare outputs between C++ and WASM for all 41 test files

## Limitations

- Benchmark scores will differ from C++ due to WASM overhead
- CSV/XML formatting may have minor differences
- Timing shows as 0 msec in WASM (Emscripten limitation)
