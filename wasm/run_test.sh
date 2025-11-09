#!/bin/bash
# Simple test script for NEC++ library

set -e

echo "==================================="
echo "NEC++ Library Test"
echo "==================================="
echo ""

# Check for g++
if ! command -v g++ &> /dev/null; then
    echo "ERROR: g++ not found. Please install a C++ compiler."
    exit 1
fi

echo "Step 1: Compiling test program..."

# Copy config.h to src directory temporarily
echo "Copying config.h..."
cp config.h ../src/config.h

# Compile a simple test using the C API
g++ -o test_necpp_simple \
    -I../src \
    -std=c++11 \
    -DWITHOUT_LAPACK=1 \
    -DNEC_ERROR_CHECK=1 \
    ../src/c_evlcom.cpp \
    ../src/c_geometry.cpp \
    ../src/c_ggrid.cpp \
    ../src/c_plot_card.cpp \
    ../src/libNEC.cpp \
    ../src/matrix_algebra.cpp \
    ../src/misc.cpp \
    ../src/nec_context.cpp \
    ../src/nec_exception.cpp \
    ../src/nec_ground.cpp \
    ../src/nec_output.cpp \
    ../src/nec_radiation_pattern.cpp \
    ../src/nec_structure_currents.cpp \
    ../src/electromag.cpp \
    ../src/nec_results.cpp \
    test_simple.cpp \
    2>&1

if [ $? -eq 0 ]; then
    echo "✓ Compilation successful"
else
    echo "✗ Compilation failed"
    exit 1
fi

echo ""
echo "Step 2: Running test program..."
echo ""

./test_necpp_simple

if [ $? -eq 0 ]; then
    echo ""
    echo "==================================="
    echo "✓ ALL TESTS PASSED"
    echo "==================================="
    rm -f test_necpp_simple
    rm -f ../src/config.h
    exit 0
else
    echo ""
    echo "==================================="
    echo "✗ TESTS FAILED"
    echo "==================================="
    rm -f test_necpp_simple
    rm -f ../src/config.h
    exit 1
fi
