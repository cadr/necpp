# Documentation Cleanup and Consolidation Plan

## Goals
1. Remove redundant documentation
2. Consolidate overlapping content
3. Create clear documentation hierarchy
4. Ensure maintainer can easily understand the changes
5. Update .claude files to reflect current state

## Proposed Changes

### 1. Root Level Cleanup

**REMOVE:**
- `FINAL_STATUS_REPORT.md` - Implementation status, redundant with work log
- `WASM_IMPLEMENTATION_COMPLETE.md` - Summary already in README and wasm docs

**KEEP & UPDATE:**
- `README.md` - Updated with clear WASM section ✅
- `DOCKER.md` - Useful Docker guide ✅
- `INSTALL.md` - Original install docs ✅

**RESULT:** Cleaner root with just essential docs

### 2. wasm/ Directory Consolidation

**CONSOLIDATE INTO SINGLE README.md:**
- Keep `wasm/README.md` as the comprehensive guide
- Remove `wasm/QUICKSTART.md` (integrate quick start into README)
- Remove `wasm/SETUP.md` (integrate setup into README)
- Remove `wasm/NPM_README.md` (content is in dist/README.md)

**STRUCTURE FOR NEW wasm/README.md:**
```markdown
# NEC++ WebAssembly Port

## Quick Start
- Docker method
- Manual build

## Building
- Prerequisites
- Build instructions
- Build options

## Usage
- Browser
- Node.js
- NPM package

## API Reference
- Link to USAGE.md for detailed API docs

## Testing
- Link to testharness docs
```

**KEEP:**
- `wasm/USAGE.md` - Comprehensive API reference ✅
- `wasm/dist/README.md` - NPM package docs ✅

### 3. testharness/ Directory Cleanup

**REMOVE:**
- `testharness/README_WASM.md` - Redundant, covered in WASM_TESTING.md

**KEEP:**
- `testharness/WASM_TESTING.md` - Comprehensive testing guide ✅
- `testharness/IMPLEMENTATION_SUMMARY.md` - Technical details ✅

### 4. .claude/ Directory Updates

**UPDATE:**
- `.claude/project-context.md` - Ensure reflects current build process
- `.claude/quick-commands.md` - Verify all commands work without Docker
- `.claude/wasm-implementation-notes.md` - Ensure current
- `.claude/wasm-test-status.md` - Update to reflect current state

**ADD:**
- Build instructions for web environment (no Docker)
- Clear npm/node availability info

## Summary

**Files to DELETE:** 5
- FINAL_STATUS_REPORT.md
- WASM_IMPLEMENTATION_COMPLETE.md
- wasm/QUICKSTART.md
- wasm/SETUP.md
- wasm/NPM_README.md
- testharness/README_WASM.md

**Files to UPDATE:** 2
- wasm/README.md (consolidate all quick start and setup content)
- .claude/* files (update to current state)

**Result:**
- From 23 markdown files to 17 markdown files
- Clearer documentation structure
- No redundant information
- All content preserved in logical locations
