#!/bin/bash
#
# Docker-based testing script for NEC++ WASM port
#
# This script builds and runs the test harness in Docker for reproducible results
#

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "NEC++ WASM Docker Test Runner"
echo "=============================="
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Build Docker image
echo "Building Docker image..."
cd "$PROJECT_ROOT"
docker build -t necpp-wasm -f testharness/Dockerfile .

echo ""
echo "Docker image built successfully"
echo ""

# Run tests
echo "Running tests..."
echo ""

# Test C++ version
echo "1. Testing C++ version..."
docker run --rm -v "$PROJECT_ROOT:/work" necpp-wasm make -f Makefile.wasm test_cpp

echo ""
echo "2. Testing WASM version..."
docker run --rm -v "$PROJECT_ROOT:/work" necpp-wasm bash -c "source /opt/emsdk/emsdk_env.sh && make -f Makefile.wasm test_wasm"

echo ""
echo "3. Comparing outputs..."
docker run --rm -v "$PROJECT_ROOT:/work" necpp-wasm bash -c "source /opt/emsdk/emsdk_env.sh && make -f Makefile.wasm compare"

echo ""
echo "✓ All tests complete"
echo ""
echo "To run tests manually in Docker:"
echo "  docker run --rm -it -v $PROJECT_ROOT:/work necpp-wasm bash"
