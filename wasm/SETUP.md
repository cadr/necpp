# NEC++ WASM NPM Package Setup Guide

This guide explains how to build and use the NEC++ WASM package as a local npm dependency.

## Quick Start

### 1. Install Emscripten SDK (First Time Only)

Before building the WASM files, you need the Emscripten SDK installed:

```bash
# Navigate to your home directory
cd /home/user

# Clone the Emscripten SDK repository
git clone https://github.com/emscripten-core/emsdk.git

# Enter the emsdk directory
cd emsdk

# Download and install the latest SDK tools (takes several minutes)
./emsdk install latest

# Activate the latest SDK version
./emsdk activate latest

# Activate PATH and environment variables
source /home/user/emsdk/emsdk_env.sh
```

**Verify installation:**
```bash
em++ --version
emcc --version
```

**IMPORTANT:** Every new terminal session requires activating Emscripten:
```bash
source /home/user/emsdk/emsdk_env.sh
```

Consider adding to `~/.bashrc` for automatic activation:
```bash
echo 'source /home/user/emsdk/emsdk_env.sh' >> ~/.bashrc
```

### 2. Build the WASM Files

You need to compile the C++ code to WebAssembly. Choose one of the following methods:

#### Option A: Using Docker (No Emscripten activation needed)

```bash
cd wasm
npm run build:docker
```

This will:
- Pull the Emscripten Docker image
- Compile the C++ code to WASM
- Generate `necpp.js` and `necpp.wasm` in the `wasm/` directory

#### Option B: Using Make with Emscripten SDK (Recommended)

If you have Emscripten installed (see step 1 above):

```bash
# Activate Emscripten environment
source /home/user/emsdk/emsdk_env.sh

# Navigate to wasm directory and build
cd /home/user/necpp/wasm
make
```

### 3. Prepare the Distribution

After building, prepare the dist directory:

```bash
cd wasm
./prepare-dist.sh
```

This will:
- Copy `necpp.js` and `necpp.wasm` to `dist/`
- Copy TypeScript definitions
- Copy README and LICENSE
- Create the `index.js` entry point

You should see output like:
```
✓ Distribution directory prepared successfully!

Contents of dist/:
-rw-r--r-- 1 user user  52K necpp.js
-rw-r--r-- 1 user user 245K necpp.wasm
-rw-r--r-- 1 user user  1.2K index.js
-rw-r--r-- 1 user user  8.5K index.d.ts
-rw-r--r-- 1 user user  5.3K README.md
-rw-r--r-- 1 user user  1.1K package.json
```

### 4. Use in Another Project

Now you can install this package from another project on your computer:

#### Method 1: Using file: protocol

In your other project:
```bash
npm install file:/absolute/path/to/necpp/wasm/dist
```

For example:
```bash
npm install file:/home/user/necpp/wasm/dist
```

#### Method 2: Using relative path

If your project is in a sibling directory:
```bash
npm install ../necpp/wasm/dist
```

#### Method 3: Using npm link (for development)

In the NEC++ wasm dist directory:
```bash
cd /path/to/necpp/wasm/dist
npm link
```

In your other project:
```bash
npm link @necpp/wasm
```

## Usage Example

After installation, create a test file:

**test.js:**
```javascript
const createNecppModule = require('@necpp/wasm');

async function simulate() {
  const Module = await createNecppModule();
  const nec = new Module.NecppWrapper();

  try {
    // Half-wave dipole at 299.8 MHz
    nec.wire(1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
    nec.geometryComplete(0);
    nec.frCard(0, 1, 299.8, 0);
    nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);
    nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
    nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);

    console.log('Max Gain:', nec.getGainMax(0), 'dBi');
    console.log('Impedance:', nec.getImpedanceReal(0), '+j', nec.getImpedanceImag(0), 'Ω');
  } finally {
    nec.delete();
  }
}

simulate().catch(console.error);
```

Run it:
```bash
node test.js
```

## TypeScript Support

The package includes TypeScript definitions:

**test.ts:**
```typescript
import createNecppModule from '@necpp/wasm';

async function simulate() {
  const Module = await createNecppModule();
  const nec = new Module.NecppWrapper();

  try {
    nec.wire(1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
    nec.geometryComplete(0);
    nec.frCard(0, 1, 299.8, 0);
    nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);
    nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
    nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);

    const results = {
      gain: nec.getGainMax(0),
      impedance: {
        real: nec.getImpedanceReal(0),
        imag: nec.getImpedanceImag(0)
      }
    };

    console.log(results);
  } finally {
    nec.delete();
  }
}

simulate();
```

## Directory Structure

After building, your wasm directory should look like:

```
wasm/
├── dist/                    # Distribution directory (install this)
│   ├── necpp.js            # WASM glue code
│   ├── necpp.wasm          # WASM binary
│   ├── index.js            # Entry point
│   ├── index.d.ts          # TypeScript definitions
│   ├── package.json        # Package manifest
│   ├── README.md           # Usage documentation
│   └── LICENSE             # License file
├── package.json            # Build scripts
├── prepare-dist.sh         # Distribution preparation script
├── build.sh               # Build script
├── Makefile               # Make build configuration
├── index.d.ts             # TypeScript definitions (source)
├── NPM_README.md          # README for npm (source)
└── SETUP.md               # This file
```

## Troubleshooting

### "necpp.js not found" error

The WASM files haven't been built yet. Run:
```bash
cd wasm
npm run build:docker  # or: make
./prepare-dist.sh
```

### Build fails with "em++ not found"

You're trying to use `make` without Emscripten installed. Use Docker instead:
```bash
npm run build:docker
```

### Module fails to load in browser

The package is currently configured for Node.js. For browser usage, you need to:
1. Copy `necpp.js` and `necpp.wasm` to your web server
2. Load them via script tag or webpack

### Permission denied on prepare-dist.sh

Make sure the script is executable:
```bash
chmod +x prepare-dist.sh
```

## Updating the Package

When you make changes to the C++ source code:

1. Rebuild the WASM:
   ```bash
   cd wasm
   npm run build:docker  # or: make
   ```

2. Prepare distribution:
   ```bash
   ./prepare-dist.sh
   ```

3. Reinstall in your project:
   ```bash
   npm install file:/path/to/necpp/wasm/dist --force
   ```

## Publishing to npm (Optional)

To publish this package to npm (requires npm account):

1. Update version in `dist/package.json`
2. Login to npm: `npm login`
3. Publish: `npm publish dist/ --access public`

## Next Steps

- Read the [API Documentation](dist/README.md) for detailed API reference
- Check out the [examples](example.js) for more usage patterns
- See the [main README](README.md) for technical details about the WASM port

## Support

- GitHub Issues: https://github.com/tmolteno/necpp/issues
- NEC-2 Documentation: https://www.nec2.org/
