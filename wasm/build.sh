#!/bin/bash

# Build script for NEC++ WebAssembly

set -e  # Exit on error

echo "================================"
echo "NEC++ WebAssembly Build Script"
echo "================================"
echo ""

# Check if Emscripten is available
if ! command -v em++ &> /dev/null; then
    echo "ERROR: Emscripten (em++) not found!"
    echo ""
    echo "Please install and activate Emscripten:"
    echo "  1. Clone emsdk: git clone https://github.com/emscripten-core/emsdk.git"
    echo "  2. Install: cd emsdk && ./emsdk install latest"
    echo "  3. Activate: ./emsdk activate latest"
    echo "  4. Setup environment: source ./emsdk_env.sh"
    echo ""
    exit 1
fi

# Display Emscripten version
echo "Emscripten version:"
em++ --version | head -n 1
echo ""

# Clean previous build
echo "Cleaning previous build..."
rm -f necpp.js necpp.wasm
echo "Done."
echo ""

# Build using Make
echo "Building NEC++ WebAssembly module..."
make

# Check if build was successful
if [ -f "necpp.js" ] && [ -f "necpp.wasm" ]; then
    echo ""
    echo "================================"
    echo "Build completed successfully!"
    echo "================================"
    echo ""
    echo "Generated files:"
    ls -lh necpp.js necpp.wasm
    echo ""
    echo "To test the build:"
    echo "  1. Start a local web server in this directory"
    echo "  2. Open demo.html in your browser"
    echo ""
    echo "Example web server commands:"
    echo "  - Python 3: python3 -m http.server 8000"
    echo "  - Python 2: python -m SimpleHTTPServer 8000"
    echo "  - Node.js: npx http-server -p 8000"
    echo ""
    echo "Then open: http://localhost:8000/demo.html"
else
    echo ""
    echo "================================"
    echo "Build FAILED!"
    echo "================================"
    echo ""
    echo "Please check the error messages above."
    exit 1
fi
