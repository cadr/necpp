#!/bin/bash
# Simple build script for nec2++

set -e

CXX=g++
CXXFLAGS="-O2 -std=c++11 -DWITHOUT_LAPACK=1 -DNEC_ERROR_CHECK=1 -I./src"

SOURCES="
src/c_evlcom.cpp
src/c_geometry.cpp
src/c_ggrid.cpp
src/c_plot_card.cpp
src/libNEC.cpp
src/matrix_algebra.cpp
src/misc.cpp
src/nec_context.cpp
src/nec_exception.cpp
src/nec_ground.cpp
src/nec_output.cpp
src/nec_radiation_pattern.cpp
src/nec_structure_currents.cpp
src/electromag.cpp
src/nec_results.cpp
src/nec2cpp.cpp
src/XGetopt.cpp
"

echo "Building nec2++..."
$CXX $CXXFLAGS $SOURCES -o nec2++ -lm

echo "Build complete: ./nec2++"
