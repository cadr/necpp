# NEC++ WebAssembly Quick Start Guide

## Easiest Method: Docker

If you have Docker installed, this is the fastest way to get started:

```bash
# From the repository root
cd /path/to/necpp
docker-compose up
```

Then open **http://localhost:8000** in your browser!

See [DOCKER.md](../DOCKER.md) for more Docker options.

---

## Manual Build Method

If you prefer to build manually without Docker, follow these steps:

### Prerequisites

1. **Install Emscripten SDK**

```bash
# Clone the repository
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Download and install the latest SDK tools
./emsdk install latest

# Make the "latest" SDK "active" for the current user
./emsdk activate latest

# Activate PATH and other environment variables in the current terminal
source ./emsdk_env.sh
```

2. **Verify Installation**

```bash
em++ --version
```

You should see output showing the Emscripten version.

## Build Steps

1. **Navigate to the wasm directory**

```bash
cd necpp/wasm
```

2. **Build using the provided script** (Recommended)

```bash
./build.sh
```

Or build manually:

```bash
make
```

3. **Verify the build**

You should see two files created:
- `necpp.js` - JavaScript glue code (~500KB)
- `necpp.wasm` - WebAssembly binary (~2-3MB)

## Running the Demo

1. **Start a local web server**

You cannot open the HTML file directly due to CORS restrictions. Use one of these methods:

**Python 3:**
```bash
python3 -m http.server 8000
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

**Node.js:**
```bash
npx http-server -p 8000
```

**PHP:**
```bash
php -S localhost:8000
```

2. **Open the demo in your browser**

Navigate to: `http://localhost:8000/demo.html`

3. **Try the simulation**

- The demo shows a half-wave dipole antenna
- Adjust the parameters (frequency, length, etc.)
- Click "Run Simulation" to see the results
- View gain, impedance, and SWR calculations

## Your First Simulation

Create a file called `test.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My First NEC++ Simulation</title>
</head>
<body>
    <h1>NEC++ Test</h1>
    <div id="output"></div>

    <script src="necpp.js"></script>
    <script>
        createNecppModule().then(function(Module) {
            const nec = new Module.NecppWrapper();

            // Simple dipole: 0.5m long, 1mm radius
            nec.wire(1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
            nec.geometryComplete(0);

            // Frequency: 299.8 MHz (1m wavelength)
            nec.frCard(0, 1, 299.8, 0);

            // Voltage source at center (segment 6 of 11)
            nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);

            // Free space
            nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);

            // Calculate pattern
            nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);

            // Display results
            const gain = nec.getGainMax(0);
            const zReal = nec.getImpedanceReal(0);
            const zImag = nec.getImpedanceImag(0);

            document.getElementById('output').innerHTML =
                '<b>Simulation Results:</b><br>' +
                'Maximum Gain: ' + gain.toFixed(2) + ' dBi<br>' +
                'Impedance: ' + zReal.toFixed(2) + ' + j' +
                zImag.toFixed(2) + ' Ω';

            nec.delete();
        });
    </script>
</body>
</html>
```

Save this file in the `wasm` directory and open it in your browser (using the local server).

## Common Issues

### Build Fails

**Problem:** `em++: command not found`

**Solution:** Make sure you've activated the Emscripten environment:
```bash
source /path/to/emsdk/emsdk_env.sh
```

**Problem:** Compilation errors about missing headers

**Solution:** Make sure you're in the correct directory (`necpp/wasm`) and the parent `src` directory exists.

### Runtime Errors

**Problem:** "Failed to fetch" or CORS errors

**Solution:** Use a local web server instead of opening the file directly.

**Problem:** Module fails to load in browser

**Solution:**
- Check that both `necpp.js` and `necpp.wasm` are in the same directory
- Clear your browser cache
- Check browser console for specific errors
- Try a different browser (Chrome, Firefox recommended)

**Problem:** "Out of memory" error

**Solution:**
- Reduce the number of segments in your model
- Reduce the number of frequency points
- Reduce radiation pattern resolution

### Incorrect Results

**Problem:** Unexpected gain or impedance values

**Solution:**
- Verify your geometry is correct (use small models first)
- Check that segments are appropriate (at least 10 per wavelength)
- Verify excitation placement
- Check frequency units (MHz, not Hz)

## Next Steps

1. **Read the full README.md** for complete API documentation
2. **Study the examples** in `example.js` and `demo.html`
3. **Experiment** with different antenna designs
4. **Learn NEC basics** from the [NEC-2 manual](https://www.nec2.org/)

## Performance Tips

1. **Start small**: Begin with simple models (< 100 segments)
2. **Optimize segments**: More isn't always better; aim for 10-20 per wavelength
3. **Use appropriate frequency steps**: Don't use too many frequency points
4. **Consider native builds**: For large production simulations, use the native C++ version

## Getting Help

- Check the main [NEC++ documentation](http://tmolteno.github.io/necpp/)
- Read the [NEC-2 manual](https://www.nec2.org/)
- Browse antenna theory resources at [antenna-theory.com](http://www.antenna-theory.com/)
- Open issues on the [GitHub repository](https://github.com/tmolteno/necpp)

## Example Antennas to Try

### Monopole over Ground
```javascript
nec.wire(1, 9, 0, 0, 0, 0, 0, 0.25, 0.001, 1.0, 1.0);
nec.geometryComplete(1);  // 1 = ground plane
nec.gnCard(1, 0, 0, 0, 0, 0, 0, 0);  // Perfect ground
```

### Loop Antenna
```javascript
// Create a loop using multiple wire segments in a circle
const radius = 0.1;
const segments = 20;
for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * 2 * Math.PI;
    const angle2 = ((i + 1) / segments) * 2 * Math.PI;
    const x1 = radius * Math.cos(angle1);
    const y1 = radius * Math.sin(angle1);
    const x2 = radius * Math.cos(angle2);
    const y2 = radius * Math.sin(angle2);
    nec.wire(i + 1, 1, x1, y1, 0, x2, y2, 0, 0.001, 1.0, 1.0);
}
```

### Yagi-Uda Array
```javascript
// Reflector
nec.wire(1, 11, -0.3, 0, -0.28, -0.3, 0, 0.28, 0.001, 1.0, 1.0);
// Driven element
nec.wire(2, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
// Director 1
nec.wire(3, 11, 0.2, 0, -0.23, 0.2, 0, 0.23, 0.001, 1.0, 1.0);
// Director 2
nec.wire(4, 11, 0.4, 0, -0.21, 0.4, 0, 0.21, 0.001, 1.0, 1.0);
```

Happy simulating!
