#!/bin/bash

# Test all WASM files and report results

PASSED=0
FAILED=0
TOTAL=0

echo "Testing WASM implementation on all test files..."
echo "================================================"
echo ""

for necfile in testharness/data/*.nec; do
    if [ ! -f "$necfile" ]; then
        continue
    fi

    TOTAL=$((TOTAL + 1))
    basename=$(basename "$necfile" .nec)
    outfile="/tmp/${basename}_wasm.out"

    # Run the test with timeout
    if timeout 10 node wasm/nec_wasm.js -i "$necfile" -o "$outfile" > /dev/null 2>&1; then
        PASSED=$((PASSED + 1))
        echo "✓ PASS: $basename"
    else
        FAILED=$((FAILED + 1))
        echo "✗ FAIL: $basename"
        # Show error
        timeout 10 node wasm/nec_wasm.js -i "$necfile" -o "$outfile" 2>&1 | grep -i "error\|fail\|divide" | head -1 | sed 's/^/  /'
    fi
done

echo ""
echo "================================================"
echo "Results: $PASSED/$TOTAL passed, $FAILED failed"
echo "Success rate: $(( PASSED * 100 / TOTAL ))%"
