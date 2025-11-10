# @necpp/wasm - NEC++ WebAssembly Package

WebAssembly port of NEC++ (Numerical Electromagnetics Code) for electromagnetic antenna simulation. Run powerful antenna simulations directly in Node.js or the browser!

## Installation

### From Local Directory

```bash
# From another project on your computer
npm install file:../path/to/necpp/wasm/dist
```

### From Git Repository

```bash
npm install git+https://github.com/tmolteno/necpp.git#wasm_port:wasm
```

## Quick Start

### Node.js Example

```javascript
const createNecppModule = require('@necpp/wasm');

async function simulate() {
  // Initialize the WASM module
  const Module = await createNecppModule();
  const nec = new Module.NecppWrapper();

  try {
    // Define a half-wave dipole antenna (0.5m length at 299.8 MHz)
    nec.wire(1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
    nec.geometryComplete(0);

    // Set frequency to 299.8 MHz
    nec.frCard(0, 1, 299.8, 0);

    // Add voltage source at center segment
    nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);

    // Free space ground
    nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);

    // Calculate radiation pattern
    nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);

    // Get results
    const gainMax = nec.getGainMax(0);
    const zReal = nec.getImpedanceReal(0);
    const zImag = nec.getImpedanceImag(0);

    console.log(`Maximum Gain: ${gainMax.toFixed(2)} dBi`);
    console.log(`Impedance: ${zReal.toFixed(2)} + j${zImag.toFixed(2)} Ω`);
  } finally {
    // Always clean up!
    nec.delete();
  }
}

simulate().catch(console.error);
```

### TypeScript Example

```typescript
import createNecppModule from '@necpp/wasm';

async function simulate() {
  const Module = await createNecppModule();
  const nec = new Module.NecppWrapper();

  try {
    // Define antenna geometry
    nec.wire(1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
    nec.geometryComplete(0);

    // Configure simulation
    nec.frCard(0, 1, 299.8, 0);
    nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);
    nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
    nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);

    // Get results
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

## API Reference

### Creating a Context

```javascript
const nec = new Module.NecppWrapper();
```

### Geometry Methods

#### `wire(tag, segments, x1, y1, z1, x2, y2, z2, radius, rdel, rrad)`

Define a wire in the antenna geometry.

- `tag`: Wire tag number (identifier)
- `segments`: Number of segments to divide the wire into
- `x1, y1, z1`: Starting coordinates in meters
- `x2, y2, z2`: Ending coordinates in meters
- `radius`: Wire radius in meters
- `rdel, rrad`: Segment ratios (typically 1.0)

#### `geometryComplete(gpflag)`

Finalize the geometry. Must be called after all geometry is defined.

- `gpflag`: Ground plane flag (0 = no ground plane, 1 = ground plane)

### Simulation Setup

#### `frCard(ifrq, nfrq, freq_mhz, del_freq)`

Set frequency parameters.

- `ifrq`: 0 for linear stepping, 1 for logarithmic
- `nfrq`: Number of frequency steps
- `freq_mhz`: Starting frequency in MHz
- `del_freq`: Frequency increment

#### `exCard(extype, tag, segment, i4, re, im, f3, f4, f5, f6)`

Define an excitation source.

- `extype`: Excitation type (0 = voltage source)
- `tag`: Wire tag number
- `segment`: Segment number for the source
- `re, im`: Voltage (real and imaginary parts)

#### `gnCard(iperf, nradl, epsr, sig, f3, f4, f5, f6)`

Set ground parameters.

- `iperf`: -1 = free space, 0 = finite ground, 1 = perfect ground
- `nradl`: Number of radial wires in ground screen
- `epsr`: Relative permittivity
- `sig`: Conductivity in S/m

#### `rpCard(calc_mode, n_theta, n_phi, xnda, ...)`

Calculate radiation pattern.

- `calc_mode`: Calculation mode (0 = normal)
- `n_theta`: Number of theta angle steps
- `n_phi`: Number of phi angle steps

### Results Methods

- `getGainMax(freq_index)` - Maximum gain in dBi
- `getGainMin(freq_index)` - Minimum gain in dBi
- `getImpedanceReal(freq_index)` - Real impedance in Ω
- `getImpedanceImag(freq_index)` - Imaginary impedance in Ω
- `getRadiationPatternCount()` - Number of calculated patterns
- `getRadiationPatternData(rp_index, theta_idx, phi_idx)` - Pattern data

### Cleanup

**IMPORTANT:** Always call `delete()` when finished to free memory!

```javascript
nec.delete();
```

## Advanced Examples

### Frequency Sweep

```javascript
const nec = new Module.NecppWrapper();

// Define antenna
nec.wire(1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
nec.geometryComplete(0);

// Sweep from 200 to 400 MHz in 21 steps
nec.frCard(0, 21, 200, 10);
nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);
nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);

// Get impedance for each frequency
for (let i = 0; i < 21; i++) {
  const freq = 200 + i * 10;
  const z = {
    real: nec.getImpedanceReal(i),
    imag: nec.getImpedanceImag(i)
  };
  console.log(`${freq} MHz: ${z.real.toFixed(2)} + j${z.imag.toFixed(2)} Ω`);
}

nec.delete();
```

### Yagi Antenna

```javascript
const nec = new Module.NecppWrapper();

// Reflector
nec.wire(1, 11, 0, -0.26, 0, 0, 0.26, 0, 0.003, 1.0, 1.0);

// Driven element
nec.wire(2, 11, 0.125, -0.24, 0, 0.125, 0.24, 0, 0.003, 1.0, 1.0);

// Director
nec.wire(3, 11, 0.3, -0.22, 0, 0.3, 0.22, 0, 0.003, 1.0, 1.0);

nec.geometryComplete(0);
nec.frCard(0, 1, 299.8, 0);
nec.exCard(0, 2, 6, 0, 1.0, 0.0, 0, 0, 0, 0);
nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
nec.rpCard(0, 91, 360, 0, 5, 0, 0, 2, 1, 1, 0, 0, 0);

console.log('Yagi Gain:', nec.getGainMax(0).toFixed(2), 'dBi');

nec.delete();
```

## System Requirements

- Node.js >= 14.0.0
- Modern browser with WebAssembly support (for browser usage)

## Building from Source

If you need to rebuild the WASM files:

### Using Docker (Recommended)

```bash
cd wasm
npm run build:docker
./prepare-dist.sh
```

### Using Emscripten SDK

```bash
# Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Build
cd /path/to/necpp/wasm
make
./prepare-dist.sh
```

## File Structure

```
dist/
├── necpp.js          # JavaScript glue code
├── necpp.wasm        # WebAssembly binary
├── index.js          # Main entry point
├── index.d.ts        # TypeScript definitions
├── README.md         # This file
└── LICENSE           # License file
```

## Performance Notes

- The WASM version uses a built-in matrix solver (no LAPACK)
- For large problems (>1000 segments), consider optimizing segment count
- Memory is limited to 2GB
- Single-threaded execution

## Troubleshooting

### Module fails to load

- Ensure both `necpp.js` and `necpp.wasm` are in the same directory
- Check that files are being served over HTTP/HTTPS (not file://)

### Out of memory

- Reduce number of segments
- Reduce number of frequency points
- Reduce radiation pattern resolution

### Incorrect results

- Verify geometry is defined correctly
- Ensure minimum 3 segments per half-wavelength
- Check excitation source placement
- Verify ground parameters

## License

NEC++ is licensed under the GNU General Public License v2.0. See LICENSE file for details.

## Links

- [NEC++ GitHub](https://github.com/tmolteno/necpp)
- [NEC-2 Documentation](https://www.nec2.org/)
- [Antenna Theory](http://www.antenna-theory.com/)

## Contributing

Contributions are welcome! Please submit issues and pull requests to the main NEC++ repository.
