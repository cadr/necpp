#!/bin/bash
# Prepare distribution directory for npm package

set -e

echo "Preparing distribution directory..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Check if WASM files exist
if [ ! -f "necpp.js" ] || [ ! -f "necpp.wasm" ]; then
    echo "ERROR: WASM files not found!"
    echo "Please build the WASM files first:"
    echo "  Option 1: Using Docker:  npm run build:docker"
    echo "  Option 2: Using Make:    cd wasm && make"
    echo ""
    echo "Requirements:"
    echo "  - Docker OR Emscripten SDK installed"
    exit 1
fi

# Copy built files to dist
echo "Copying necpp.js to dist/..."
cp necpp.js dist/

echo "Copying necpp.wasm to dist/..."
cp necpp.wasm dist/

# Copy TypeScript definitions
echo "Copying TypeScript definitions..."
cp index.d.ts dist/

# Create an index.js wrapper for easier imports
echo "Creating index.js wrapper..."
cat > dist/index.js << 'EOF'
/**
 * NEC++ WebAssembly Module
 *
 * Main entry point for the NEC++ electromagnetic antenna simulation library
 */

const createNecppModule = require('./necpp.js');

module.exports = createNecppModule;
module.exports.default = createNecppModule;
EOF

# Copy README for npm
if [ -f "NPM_README.md" ]; then
    echo "Copying NPM README..."
    cp NPM_README.md dist/README.md
elif [ -f "README.md" ]; then
    echo "Copying README..."
    cp README.md dist/
fi

# Copy LICENSE from parent if available
if [ -f "../COPYING" ]; then
    echo "Copying LICENSE..."
    cp ../COPYING dist/LICENSE
fi

echo ""
echo "✓ Distribution directory prepared successfully!"
echo ""
echo "Contents of dist/:"
ls -lh dist/
echo ""
echo "You can now install this package locally with:"
echo "  npm install /path/to/necpp/wasm/dist"
echo ""
echo "Or from another project:"
echo "  npm install file:../path/to/necpp/wasm/dist"
