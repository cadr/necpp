# Using NEC++ WebAssembly from JavaScript and TypeScript

This guide explains how to use the NEC++ WebAssembly module in both JavaScript and TypeScript applications.

## Table of Contents

- [Installation](#installation)
- [JavaScript Usage](#javascript-usage)
- [TypeScript Usage](#typescript-usage)
- [API Reference](#api-reference)
- [Complete Examples](#complete-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Installation

### Browser (HTML)

Simply include the built JavaScript file:

```html
<script src="necpp.js"></script>
<script>
  createNecppModule().then(function(Module) {
    // Use the module
  });
</script>
```

### Node.js

```javascript
const createNecppModule = require('./necpp.js');

async function main() {
  const Module = await createNecppModule();
  // Use the module
}
```

### Modern JavaScript (ES6+)

```javascript
import createNecppModule from './necpp.js';

const Module = await createNecppModule();
```

## JavaScript Usage

### Basic Example

```javascript
// Load the module
const necModule = await createNecppModule();

// Create a NEC++ context
const nec = new necModule.NecppWrapper();

// Define a half-wave dipole antenna (0.5m length)
nec.wire(
  1,      // tag ID
  11,     // number of segments
  0, 0, -0.25,  // start point (x, y, z) in meters
  0, 0, 0.25,   // end point (x, y, z) in meters
  0.001,  // wire radius in meters (1mm)
  1.0, 1.0  // segment length and radius ratios
);

// Complete the geometry
nec.geometryComplete(0);  // 0 = no ground plane

// Set frequency to 299.8 MHz (approx. 1m wavelength)
nec.frCard(
  0,      // frequency stepping type (0 = linear)
  1,      // number of frequency steps
  299.8,  // starting frequency in MHz
  0       // frequency increment
);

// Add a voltage source at the center
const centerSegment = 6;  // center of 11 segments
nec.exCard(
  0,      // excitation type (0 = voltage source)
  1,      // tag number
  centerSegment,  // segment number
  0,      // unused parameter
  1.0, 0.0,  // voltage: real and imaginary parts
  0, 0, 0, 0  // additional parameters
);

// Set ground parameters (free space)
nec.gnCard(
  -1,     // ground type (-1 = free space)
  0,      // number of radials
  0, 0,   // dielectric constant, conductivity
  0, 0, 0, 0  // additional ground parameters
);

// Calculate radiation pattern
nec.rpCard(
  0,      // calculation mode (0 = normal)
  91,     // number of theta angles (0-90 degrees)
  1,      // number of phi angles
  0,      // output format
  5,      // normalization (5 = total gain)
  0, 0,   // additional parameters
  0, 0,   // theta and phi starting angles
  1, 0,   // theta and phi increments
  0, 0    // radial distance and gain normalization
);

// Get results
const gainMax = nec.getGainMax(0);      // Maximum gain in dBi
const gainMin = nec.getGainMin(0);      // Minimum gain in dBi
const gainMean = nec.getGainMean(0);    // Mean gain in dBi
const zReal = nec.getImpedanceReal(0);  // Real impedance (Ω)
const zImag = nec.getImpedanceImag(0);  // Imaginary impedance (Ω)

console.log(`Maximum Gain: ${gainMax.toFixed(2)} dBi`);
console.log(`Impedance: ${zReal.toFixed(2)} + j${zImag.toFixed(2)} Ω`);

// Calculate SWR (Standing Wave Ratio) for 50Ω system
const z0 = 50.0;
const gammaMag = Math.sqrt(
  Math.pow(zReal - z0, 2) + Math.pow(zImag, 2)
) / Math.sqrt(
  Math.pow(zReal + z0, 2) + Math.pow(zImag, 2)
);
const swr = (1 + gammaMag) / (1 - gammaMag);
console.log(`SWR (50Ω): ${swr.toFixed(2)}:1`);

// Clean up when done
nec.delete();
```

### Creating a Reusable Function

```javascript
async function simulateDipole(frequency, length, radius, segments = 11) {
  const necModule = await createNecppModule();
  const nec = new necModule.NecppWrapper();

  try {
    // Define wire
    const halfLength = length / 2;
    nec.wire(1, segments, 0, 0, -halfLength, 0, 0, halfLength, radius, 1.0, 1.0);

    // Complete geometry and set parameters
    nec.geometryComplete(0);
    nec.frCard(0, 1, frequency, 0);
    nec.exCard(0, 1, Math.floor(segments / 2) + 1, 0, 1.0, 0.0, 0, 0, 0, 0);
    nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
    nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);

    // Get results
    return {
      gainMax: nec.getGainMax(0),
      gainMin: nec.getGainMin(0),
      gainMean: nec.getGainMean(0),
      impedanceReal: nec.getImpedanceReal(0),
      impedanceImag: nec.getImpedanceImag(0)
    };
  } finally {
    nec.delete();
  }
}

// Use it
const results = await simulateDipole(299.8, 0.5, 0.001, 11);
console.log('Gain:', results.gainMax, 'dBi');
console.log('Impedance:', results.impedanceReal, '+j', results.impedanceImag, 'Ω');
```

## TypeScript Usage

### Type Definitions

Create a `necpp.d.ts` file:

```typescript
// necpp.d.ts

export interface NecppModule {
  NecppWrapper: new () => NecppWrapper;
}

export interface NecppWrapper {
  // Geometry methods
  wire(
    tagId: number,
    segCount: number,
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    radius: number,
    rdel: number,
    rrad: number
  ): void;

  geometryComplete(gpflag: number): void;

  spCard(
    ns: number,
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number
  ): void;

  gxCard(cardInt: number, intParam2: number): void;

  // Ground parameters
  gnCard(
    iperf: number,
    nradl: number,
    epsr: number,
    sig: number,
    tmp3: number,
    tmp4: number,
    tmp5: number,
    tmp6: number
  ): void;

  // Frequency
  frCard(
    ifrq: number,
    nfrq: number,
    freqMhz: number,
    delFreq: number
  ): void;

  // Excitation
  exCard(
    extype: number,
    i2: number,
    i3: number,
    i4: number,
    f1r: number,
    f2r: number,
    f3r: number,
    f4r: number,
    f5r: number,
    f6r: number
  ): void;

  // Loading
  ldCard(
    ldtyp: number,
    ldtag: number,
    ldtagf: number,
    ldtagt: number,
    zlr: number,
    zli: number,
    zlc: number
  ): void;

  // Transmission line
  tlCard(
    itmp1: number,
    itmp2: number,
    itmp3: number,
    itmp4: number,
    tmp1: number,
    tmp2: number,
    tmp3: number,
    tmp4: number,
    tmp5: number,
    tmp6: number
  ): void;

  // Network
  ntCard(
    itmp1: number,
    itmp2: number,
    itmp3: number,
    itmp4: number,
    tmp1: number,
    tmp2: number,
    tmp3: number,
    tmp4: number,
    tmp5: number,
    tmp6: number
  ): void;

  // Radiation pattern
  rpCard(
    calcMode: number,
    nTheta: number,
    nPhi: number,
    outputFormat: number,
    normalization: number,
    D: number,
    A: number,
    theta0: number,
    phi0: number,
    deltaTheta: number,
    deltaPhi: number,
    radialDistance: number,
    gainNorm: number
  ): void;

  // Results retrieval
  getGainMax(freqIndex: number): number;
  getGainMin(freqIndex: number): number;
  getGainMean(freqIndex: number): number;
  getGainSd(freqIndex: number): number;
  getImpedanceReal(freqIndex: number): number;
  getImpedanceImag(freqIndex: number): number;
  getGain(freqIndex: number, thetaIndex: number, phiIndex: number): number;

  // Error handling
  getErrorMessage(): string;

  // Cleanup
  delete(): void;
}

export default function createNecppModule(): Promise<NecppModule>;
```

### TypeScript Example

```typescript
import createNecppModule, { NecppModule, NecppWrapper } from './necpp';

interface SimulationResult {
  gainMax: number;
  gainMin: number;
  gainMean: number;
  impedanceReal: number;
  impedanceImag: number;
  swr: number;
}

interface AntennaConfig {
  frequency: number;  // MHz
  length: number;     // meters
  radius: number;     // meters
  segments: number;
}

class AntennaSimulator {
  private module: NecppModule | null = null;

  async initialize(): Promise<void> {
    this.module = await createNecppModule();
  }

  async simulateDipole(config: AntennaConfig): Promise<SimulationResult> {
    if (!this.module) {
      throw new Error('Module not initialized. Call initialize() first.');
    }

    const nec: NecppWrapper = new this.module.NecppWrapper();

    try {
      // Define wire geometry
      const halfLength = config.length / 2;
      nec.wire(
        1,                    // tag
        config.segments,      // segments
        0, 0, -halfLength,    // start
        0, 0, halfLength,     // end
        config.radius,        // radius
        1.0, 1.0             // rdel, rrad
      );

      // Complete geometry
      nec.geometryComplete(0);

      // Set frequency
      nec.frCard(0, 1, config.frequency, 0);

      // Add voltage source at center
      const centerSeg = Math.floor(config.segments / 2) + 1;
      nec.exCard(0, 1, centerSeg, 0, 1.0, 0.0, 0, 0, 0, 0);

      // Free space ground
      nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);

      // Calculate radiation pattern
      nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);

      // Retrieve results
      const zReal = nec.getImpedanceReal(0);
      const zImag = nec.getImpedanceImag(0);

      return {
        gainMax: nec.getGainMax(0),
        gainMin: nec.getGainMin(0),
        gainMean: nec.getGainMean(0),
        impedanceReal: zReal,
        impedanceImag: zImag,
        swr: this.calculateSWR(zReal, zImag, 50.0)
      };
    } finally {
      nec.delete();
    }
  }

  private calculateSWR(
    zReal: number,
    zImag: number,
    z0: number = 50.0
  ): number {
    const gammaMag = Math.sqrt(
      Math.pow(zReal - z0, 2) + Math.pow(zImag, 2)
    ) / Math.sqrt(
      Math.pow(zReal + z0, 2) + Math.pow(zImag, 2)
    );
    return (1 + gammaMag) / (1 - gammaMag);
  }
}

// Usage
async function main() {
  const simulator = new AntennaSimulator();
  await simulator.initialize();

  const config: AntennaConfig = {
    frequency: 299.8,  // MHz
    length: 0.5,       // meters
    radius: 0.001,     // meters
    segments: 11
  };

  const results = await simulator.simulateDipole(config);

  console.log('Simulation Results:');
  console.log(`  Gain: ${results.gainMax.toFixed(2)} dBi`);
  console.log(`  Impedance: ${results.impedanceReal.toFixed(2)} + j${results.impedanceImag.toFixed(2)} Ω`);
  console.log(`  SWR: ${results.swr.toFixed(2)}:1`);
}

main().catch(console.error);
```

### Advanced TypeScript: Frequency Sweep

```typescript
interface FrequencySweepConfig {
  startFreq: number;    // MHz
  endFreq: number;      // MHz
  steps: number;
  antenna: AntennaConfig;
}

interface FrequencyPoint {
  frequency: number;
  result: SimulationResult;
}

class FrequencySweep {
  async sweep(config: FrequencySweepConfig): Promise<FrequencyPoint[]> {
    const module = await createNecppModule();
    const results: FrequencyPoint[] = [];

    const freqStep = (config.endFreq - config.startFreq) / (config.steps - 1);

    for (let i = 0; i < config.steps; i++) {
      const freq = config.startFreq + i * freqStep;
      const nec = new module.NecppWrapper();

      try {
        // Define antenna
        const halfLength = config.antenna.length / 2;
        nec.wire(
          1, config.antenna.segments,
          0, 0, -halfLength,
          0, 0, halfLength,
          config.antenna.radius,
          1.0, 1.0
        );

        nec.geometryComplete(0);
        nec.frCard(0, 1, freq, 0);

        const centerSeg = Math.floor(config.antenna.segments / 2) + 1;
        nec.exCard(0, 1, centerSeg, 0, 1.0, 0.0, 0, 0, 0, 0);
        nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
        nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);

        const zReal = nec.getImpedanceReal(0);
        const zImag = nec.getImpedanceImag(0);

        results.push({
          frequency: freq,
          result: {
            gainMax: nec.getGainMax(0),
            gainMin: nec.getGainMin(0),
            gainMean: nec.getGainMean(0),
            impedanceReal: zReal,
            impedanceImag: zImag,
            swr: this.calculateSWR(zReal, zImag)
          }
        });
      } finally {
        nec.delete();
      }
    }

    return results;
  }

  private calculateSWR(zReal: number, zImag: number, z0: number = 50.0): number {
    const gammaMag = Math.sqrt(
      Math.pow(zReal - z0, 2) + Math.pow(zImag, 2)
    ) / Math.sqrt(
      Math.pow(zReal + z0, 2) + Math.pow(zImag, 2)
    );
    return (1 + gammaMag) / (1 - gammaMag);
  }
}

// Usage
const sweeper = new FrequencySweep();
const sweepResults = await sweeper.sweep({
  startFreq: 250,
  endFreq: 350,
  steps: 21,
  antenna: {
    frequency: 299.8,  // Not used in sweep
    length: 0.5,
    radius: 0.001,
    segments: 11
  }
});

// Find resonant frequency (where impedance is most real)
const resonant = sweepResults.reduce((min, point) =>
  Math.abs(point.result.impedanceImag) < Math.abs(min.result.impedanceImag)
    ? point
    : min
);

console.log(`Resonant frequency: ${resonant.frequency.toFixed(1)} MHz`);
console.log(`At resonance: ${resonant.result.impedanceReal.toFixed(2)} + j${resonant.result.impedanceImag.toFixed(2)} Ω`);
```

## API Reference

### Geometry Methods

#### `wire(tag, segments, x1, y1, z1, x2, y2, z2, radius, rdel, rrad)`

Defines a wire element in the antenna geometry.

**Parameters:**
- `tag` (number): Wire tag/identifier (1-based)
- `segments` (number): Number of segments to divide the wire into
- `x1, y1, z1` (number): Starting point coordinates in meters
- `x2, y2, z2` (number): Ending point coordinates in meters
- `radius` (number): Wire radius in meters
- `rdel` (number): Ratio for segment length variation (usually 1.0)
- `rrad` (number): Ratio for segment radius variation (usually 1.0)

**Example:**
```javascript
// 0.5m vertical wire at origin
nec.wire(1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
```

#### `geometryComplete(gpflag)`

Finalizes the geometry and prepares for simulation.

**Parameters:**
- `gpflag` (number): Ground plane flag
  - `0`: No ground plane
  - `1`: Ground plane at z=0
  - `-1`: Infinite ground plane

### Simulation Setup Methods

#### `frCard(ifrq, nfrq, freq_mhz, del_freq)`

Sets frequency parameters.

**Parameters:**
- `ifrq` (number): Frequency stepping type (0 = linear)
- `nfrq` (number): Number of frequency steps
- `freq_mhz` (number): Starting frequency in MHz
- `del_freq` (number): Frequency increment in MHz

#### `exCard(extype, tag, segment, unused, re, im, ...)`

Defines an excitation source.

**Parameters:**
- `extype` (number): Excitation type
  - `0`: Voltage source
  - `1`: Linear wave
  - `4`: Current source
- `tag` (number): Wire tag
- `segment` (number): Segment number for source placement
- `re, im` (number): Source voltage/current (real and imaginary)

#### `gnCard(iperf, nradl, epsr, sig, ...)`

Sets ground parameters.

**Parameters:**
- `iperf` (number): Ground type
  - `-1`: Free space (no ground)
  - `0`: Finite ground
  - `1`: Perfect ground
- `nradl` (number): Number of radial wires
- `epsr` (number): Relative dielectric constant
- `sig` (number): Conductivity (S/m)

#### `rpCard(calc_mode, n_theta, n_phi, ...)`

Calculates radiation pattern.

**Parameters:**
- `calc_mode` (number): Calculation mode (0 = normal)
- `n_theta` (number): Number of theta angle points
- `n_phi` (number): Number of phi angle points

### Results Methods

#### `getGainMax(freq_index)`
Returns maximum gain in dBi for the specified frequency index.

#### `getGainMin(freq_index)`
Returns minimum gain in dBi.

#### `getGainMean(freq_index)`
Returns mean gain in dBi.

#### `getGainSd(freq_index)`
Returns gain standard deviation in dB.

#### `getImpedanceReal(freq_index)`
Returns real part of input impedance in Ω.

#### `getImpedanceImag(freq_index)`
Returns imaginary part of input impedance in Ω.

#### `getGain(freq_index, theta_index, phi_index)`
Returns gain at a specific angle point.

### Memory Management

#### `delete()`

**IMPORTANT:** Always call `delete()` when done with a NecppWrapper instance to free memory.

```javascript
const nec = new necModule.NecppWrapper();
try {
  // Use nec...
} finally {
  nec.delete();  // Always clean up!
}
```

## Complete Examples

### Example 1: Yagi-Uda Array

```javascript
async function simulateYagi() {
  const necModule = await createNecppModule();
  const nec = new necModule.NecppWrapper();

  try {
    // Reflector (longer)
    nec.wire(1, 11, -0.3, 0, -0.28, -0.3, 0, 0.28, 0.001, 1.0, 1.0);

    // Driven element
    nec.wire(2, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);

    // Director 1 (shorter)
    nec.wire(3, 11, 0.2, 0, -0.23, 0.2, 0, 0.23, 0.001, 1.0, 1.0);

    // Director 2 (even shorter)
    nec.wire(4, 11, 0.4, 0, -0.21, 0.4, 0, 0.21, 0.001, 1.0, 1.0);

    nec.geometryComplete(0);
    nec.frCard(0, 1, 299.8, 0);
    nec.exCard(0, 2, 6, 0, 1.0, 0.0, 0, 0, 0, 0);  // Excite driven element
    nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
    nec.rpCard(0, 91, 360, 0, 5, 0, 0, 0, 0, 1, 1, 0, 0);

    return {
      gain: nec.getGainMax(0),
      impedanceReal: nec.getImpedanceReal(0),
      impedanceImag: nec.getImpedanceImag(0)
    };
  } finally {
    nec.delete();
  }
}
```

### Example 2: Loop Antenna (TypeScript)

```typescript
async function simulateLoop(radius: number, segments: number = 20): Promise<SimulationResult> {
  const module = await createNecppModule();
  const nec = new module.NecppWrapper();

  try {
    // Create circular loop using multiple wire segments
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * 2 * Math.PI;
      const angle2 = ((i + 1) / segments) * 2 * Math.PI;

      const x1 = radius * Math.cos(angle1);
      const y1 = radius * Math.sin(angle1);
      const x2 = radius * Math.cos(angle2);
      const y2 = radius * Math.sin(angle2);

      nec.wire(i + 1, 1, x1, y1, 0, x2, y2, 0, 0.001, 1.0, 1.0);
    }

    nec.geometryComplete(0);

    // Calculate frequency for 1 wavelength loop circumference
    const circumference = 2 * Math.PI * radius;
    const wavelength = circumference;
    const frequency = 299.8 / wavelength;  // c/λ in MHz

    nec.frCard(0, 1, frequency, 0);
    nec.exCard(0, 1, 1, 0, 1.0, 0.0, 0, 0, 0, 0);
    nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
    nec.rpCard(0, 91, 360, 0, 5, 0, 0, 0, 0, 1, 1, 0, 0);

    const zReal = nec.getImpedanceReal(0);
    const zImag = nec.getImpedanceImag(0);

    return {
      gainMax: nec.getGainMax(0),
      gainMin: nec.getGainMin(0),
      gainMean: nec.getGainMean(0),
      impedanceReal: zReal,
      impedanceImag: zImag,
      swr: calculateSWR(zReal, zImag, 50)
    };
  } finally {
    nec.delete();
  }
}
```

## Best Practices

### 1. Always Clean Up

```javascript
// ✓ GOOD - using try/finally
const nec = new necModule.NecppWrapper();
try {
  // simulation code
} finally {
  nec.delete();
}

// ✗ BAD - memory leak if error occurs
const nec = new necModule.NecppWrapper();
// simulation code
nec.delete();
```

### 2. Validate Input Parameters

```javascript
function validateAntennaConfig(config) {
  if (config.frequency <= 0) {
    throw new Error('Frequency must be positive');
  }
  if (config.segments < 3) {
    throw new Error('Segments must be at least 3');
  }
  if (config.radius <= 0) {
    throw new Error('Radius must be positive');
  }
}
```

### 3. Use Appropriate Segmentation

```javascript
// Rule of thumb: 10-20 segments per wavelength
function calculateSegments(wireLength, frequency) {
  const wavelength = 299.8 / frequency;  // meters
  const segmentsPerWavelength = 15;
  const segments = Math.ceil((wireLength / wavelength) * segmentsPerWavelength);

  // Ensure odd number for center-fed antennas
  return segments % 2 === 0 ? segments + 1 : segments;
}
```

### 4. Handle Errors Gracefully

```javascript
async function safeSimulation(config) {
  let nec = null;
  try {
    const module = await createNecppModule();
    nec = new module.NecppWrapper();

    // Simulation code...

    return results;
  } catch (error) {
    console.error('Simulation failed:', error.message);
    const errorMsg = nec?.getErrorMessage() || 'Unknown error';
    throw new Error(`NEC++ simulation error: ${errorMsg}`);
  } finally {
    nec?.delete();
  }
}
```

### 5. Reuse Module Instance

```javascript
// ✓ GOOD - load module once
const necModule = await createNecppModule();

for (const config of configurations) {
  const nec = new necModule.NecppWrapper();
  try {
    // simulate with config
  } finally {
    nec.delete();
  }
}

// ✗ BAD - loading module repeatedly
for (const config of configurations) {
  const necModule = await createNecppModule();  // Wasteful!
  // ...
}
```

## Troubleshooting

### Module Loading Issues

**Problem:** Module fails to load in browser

**Solution:** Make sure both `necpp.js` and `necpp.wasm` are served from the same directory and accessible via HTTP/HTTPS (not `file://`).

### Memory Issues

**Problem:** "Out of memory" or slow performance

**Solutions:**
- Reduce number of segments
- Reduce radiation pattern resolution
- Call `delete()` on contexts when done
- For many simulations, reuse the module instance

### Incorrect Results

**Problem:** Unexpected gain or impedance values

**Solutions:**
- Check geometry: use visualization tools to verify
- Ensure adequate segmentation (10-20 per wavelength)
- Verify frequency units (MHz not Hz)
- Check excitation placement (usually at center segment)

### TypeScript Type Errors

**Problem:** TypeScript doesn't recognize NecppWrapper methods

**Solution:** Make sure `necpp.d.ts` is in your project and referenced in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["./necpp.d.ts"]
  }
}
```

## Additional Resources

- [NEC-2 Manual](https://www.nec2.org/) - Original NEC-2 documentation
- [Antenna Theory](http://www.antenna-theory.com/) - Educational resource
- [NEC++ Documentation](http://tmolteno.github.io/necpp/) - Full C++ API docs
- [Example Antennas](../example/) - More example antenna designs

## License

NEC++ is licensed under the GNU General Public License (GPL). Your application using NEC++ must also comply with the GPL license terms.
