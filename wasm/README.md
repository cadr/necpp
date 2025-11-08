# NEC++ WebAssembly Port

This directory contains the WebAssembly port of NEC++ (Numerical Electromagnetics Code), allowing you to run electromagnetic antenna simulations directly in a web browser or Node.js environment.

## Overview

NEC++ is a powerful electromagnetic simulation software that implements the Method of Moments (MoM) for antenna modeling. This WebAssembly port makes it possible to:

- Run antenna simulations entirely in the browser
- Use NEC++ in Node.js applications
- Integrate electromagnetic simulation into web applications
- Perform antenna design and analysis without installing native software

## Quick Start with Docker (Easiest!)

The fastest way to try the demo is using Docker:

```bash
# From the repository root
docker-compose up
```

Then open **http://localhost:8000** in your browser!

For more Docker options, see the [Docker Guide](../DOCKER.md) in the repository root.

## Building the WebAssembly Module

### Prerequisites

You need to have the Emscripten SDK installed. If you don't have it:

```bash
# Clone the Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Install and activate the latest SDK
./emsdk install latest
./emsdk activate latest

# Activate PATH and other environment variables
source ./emsdk_env.sh
```

### Build Instructions

#### Using Make (Recommended)

```bash
cd wasm
make
```

This will generate:
- `necpp.js` - The JavaScript glue code
- `necpp.wasm` - The WebAssembly binary

#### Using CMake

```bash
cd wasm
mkdir build
cd build
emcmake cmake ..
emmake make
```

#### Build Options

The build is configured with the following features:

- **No LAPACK dependency**: Uses built-in matrix solver
- **Array bounds checking**: Enabled for safety
- **Memory growth**: Allows dynamic memory allocation
- **Maximum memory**: 2GB limit
- **No filesystem**: Optimized for web, no file I/O dependencies

## Usage

### Browser Usage

Include the generated JavaScript file in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <title>NEC++ Demo</title>
</head>
<body>
    <script src="necpp.js"></script>
    <script>
        createNecppModule().then(function(Module) {
            // Create a new NEC++ context
            const nec = new Module.NecppWrapper();

            // Define a simple dipole antenna
            nec.wire(1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
            nec.geometryComplete(0);

            // Set frequency to 299.8 MHz
            nec.frCard(0, 1, 299.8, 0);

            // Add voltage source at center
            nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);

            // Free space ground
            nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);

            // Calculate radiation pattern
            nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);

            // Get results
            console.log('Max Gain:', nec.getGainMax(0), 'dBi');
            console.log('Impedance:', nec.getImpedanceReal(0),
                        '+j', nec.getImpedanceImag(0), 'Ω');

            // Clean up
            nec.delete();
        });
    </script>
</body>
</html>
```

### Node.js Usage

```javascript
const createNecppModule = require('./necpp.js');

async function simulate() {
    const necModule = await createNecppModule();
    const nec = new necModule.NecppWrapper();

    // Your simulation code here...
    nec.wire(1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
    nec.geometryComplete(0);
    nec.frCard(0, 1, 299.8, 0);
    nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);
    nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
    nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);

    const gainMax = nec.getGainMax(0);
    console.log('Maximum gain:', gainMax, 'dBi');

    nec.delete();
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

- `tag`: Wire tag number
- `segments`: Number of segments
- `x1, y1, z1`: Starting coordinates (meters)
- `x2, y2, z2`: Ending coordinates (meters)
- `radius`: Wire radius (meters)
- `rdel, rrad`: Segment length and radius ratios (usually 1.0)

#### `geometryComplete(gpflag)`

Finalize the geometry. Call after all geometry is defined.

- `gpflag`: Ground plane flag (0 = no ground plane)

### Simulation Setup

#### `frCard(ifrq, nfrq, freq_mhz, del_freq)`

Set frequency parameters.

- `ifrq`: Frequency type (0 = linear)
- `nfrq`: Number of frequencies
- `freq_mhz`: Starting frequency in MHz
- `del_freq`: Frequency increment

#### `exCard(extype, tag, segment, unused, re, im, ...)`

Define an excitation source.

- `extype`: Excitation type (0 = voltage source)
- `tag`: Wire tag
- `segment`: Segment number
- `re, im`: Voltage (real and imaginary parts)

#### `gnCard(iperf, nradl, epsr, sig, ...)`

Set ground parameters.

- `iperf`: Ground type (-1 = free space, 0 = finite ground, 1 = perfect ground)
- `nradl`: Number of radials
- `epsr`: Relative permittivity
- `sig`: Conductivity (S/m)

#### `rpCard(calc_mode, n_theta, n_phi, ...)`

Calculate radiation pattern.

- `calc_mode`: Calculation mode (0 = normal)
- `n_theta`: Number of theta angles
- `n_phi`: Number of phi angles

### Results Retrieval

#### Gain Methods

- `getGainMax(freq_index)`: Maximum gain (dBi)
- `getGainMin(freq_index)`: Minimum gain (dBi)
- `getGainMean(freq_index)`: Mean gain (dBi)
- `getGainSd(freq_index)`: Gain standard deviation (dB)

#### Impedance Methods

- `getImpedanceReal(freq_index)`: Real part of impedance (Ω)
- `getImpedanceImag(freq_index)`: Imaginary part of impedance (Ω)

#### Radiation Pattern Methods

- `getRpCount()`: Number of radiation patterns
- `getRpNtheta(rp_index)`: Number of theta points
- `getRpNphi(rp_index)`: Number of phi points
- `getRpTheta(rp_index, theta_index, phi_index)`: Theta angle (degrees)
- `getRpPhi(rp_index, theta_index, phi_index)`: Phi angle (degrees)
- `getRpGainTot(rp_index, theta_index, phi_index)`: Total gain (dBi)
- `getRpGainVert(rp_index, theta_index, phi_index)`: Vertical polarization gain (dBi)
- `getRpGainHoriz(rp_index, theta_index, phi_index)`: Horizontal polarization gain (dBi)
- `getRpGainRhcp(rp_index, theta_index, phi_index)`: Right-hand circular polarization gain (dBi)
- `getRpGainLhcp(rp_index, theta_index, phi_index)`: Left-hand circular polarization gain (dBi)

### Cleanup

```javascript
nec.delete();  // Always call when done to free memory
```

## Examples

### Example 1: Half-Wave Dipole

```javascript
const nec = new Module.NecppWrapper();

// Half-wave dipole at 299.8 MHz (approximately 1m wavelength)
nec.wire(1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
nec.geometryComplete(0);
nec.frCard(0, 1, 299.8, 0);
nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);
nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);

console.log('Gain:', nec.getGainMax(0), 'dBi');
console.log('Impedance:', nec.getImpedanceReal(0), '+j', nec.getImpedanceImag(0));

nec.delete();
```

### Example 2: Frequency Sweep

```javascript
const nec = new Module.NecppWrapper();

// Define antenna geometry
nec.wire(1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
nec.geometryComplete(0);

// Sweep from 200 MHz to 400 MHz in 20 steps
nec.frCard(0, 20, 200, 10);
nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);
nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);

// Get results for each frequency
for (let i = 0; i < 20; i++) {
    const freq = 200 + i * 10;
    const zReal = nec.getImpedanceReal(i);
    const zImag = nec.getImpedanceImag(i);
    console.log(`${freq} MHz: Z = ${zReal.toFixed(2)} + j${zImag.toFixed(2)} Ω`);
}

nec.delete();
```

## Demo

Open `demo.html` in a web browser to see an interactive demo of the NEC++ WebAssembly module. The demo includes:

- Interactive parameter controls
- Real-time simulation
- Visual display of results
- Example of a half-wave dipole antenna

## Files in this Directory

- `CMakeLists.txt` - CMake build configuration for Emscripten
- `Makefile` - Simple Makefile for direct emcc compilation
- `necpp_bindings.cpp` - C++ bindings using Embind
- `misc_wasm.cpp` - WebAssembly-specific version of misc.cpp
- `wasm_compat.h` - Compatibility header for platform-specific code
- `demo.html` - Interactive browser demo
- `example.js` - Simple JavaScript example
- `README.md` - This file

## Performance Notes

- The WebAssembly version uses a built-in matrix solver (no LAPACK) which may be slower than native builds with optimized BLAS/LAPACK
- For large problems (>1000 segments), consider:
  - Breaking the problem into smaller parts
  - Using a native build for initial design
  - Optimizing segment count
- Memory growth is enabled but limited to 2GB

## Limitations

- No file I/O (all input/output through JavaScript API)
- No plot file generation (use JavaScript to visualize data)
- Timing functions return stub values (use JavaScript's performance.now())
- No signal handling
- Single-threaded execution

## Troubleshooting

### Module fails to load

- Ensure both `necpp.js` and `necpp.wasm` are in the same directory
- Check browser console for errors
- Verify you're serving files over HTTP/HTTPS (not file://)

### Out of memory errors

- Reduce the number of segments
- Reduce the number of frequency points
- Reduce radiation pattern resolution

### Incorrect results

- Check that geometry is defined correctly
- Ensure segments are not too few (minimum 3 per half-wavelength)
- Verify excitation source placement
- Check ground parameters

## Further Reading

- [NEC++ Documentation](http://tmolteno.github.io/necpp/)
- [NEC-2 Manual](https://www.nec2.org/)
- [Emscripten Documentation](https://emscripten.org/)
- [Antenna Theory](http://www.antenna-theory.com/)

## License

NEC++ is licensed under the GNU General Public License (GPL). See the main repository LICENSE file for details.

## Contributing

Contributions to improve the WebAssembly port are welcome! Please submit issues and pull requests to the main NEC++ repository.
