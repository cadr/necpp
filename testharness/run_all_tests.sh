#!/bin/bash
TESTS=(
36dip Collinear_1L GA487 Gs_8d_bb K5332187 Yg_4x6_b biquad buoy 
dipole_anim discone ek_test example1 example2 example3 example4 
example5 example6 excessive_gain ga_pjw_0 ga_pjw_1 gn2 hang 
herzian_dipole intersection inverted_v medium_test neoklis_bug 
patch_999 patch_999_2 plane_wave_excitation plet_helix plet_helixumts 
salt_ground sommerfeld2 sommerfeld3 sommerfield1 sp_and_sc test299 yagi
)

PASSED=0
FAILED=0
FAILED_TESTS=()

echo "Running all WASM comparison tests..."
echo "======================================"
echo ""

for test in "${TESTS[@]}"; do
  echo -n "Testing $test ... "
  if make -f Makefile.wasm compare_one FILE=$test > /tmp/test_${test}.log 2>&1; then
    echo "✓ PASS"
    PASSED=$((PASSED + 1))
  else
    echo "✗ FAIL"
    FAILED=$((FAILED + 1))
    FAILED_TESTS+=("$test")
  fi
done

echo ""
echo "======================================"
echo "Summary: $PASSED passed, $FAILED failed"
echo ""

if [ $FAILED -gt 0 ]; then
  echo "Failed tests:"
  for test in "${FAILED_TESTS[@]}"; do
    echo "  - $test"
  done
  echo ""
  echo "Logs available in /tmp/test_*.log"
fi
