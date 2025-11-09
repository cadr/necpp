#!/bin/bash
# Test script for NEC++ WebAssembly build

set -e

echo "==================================="
echo "NEC++ WebAssembly Build Test"
echo "==================================="
echo ""

# Setup Emscripten environment
export PATH="/home/user/emsdk:/home/user/emsdk/upstream/emscripten:$PATH"
export EMSDK="/home/user/emsdk"

# Check for emcc
if ! command -v emcc &> /dev/null; then
    echo "ERROR: emcc not found. Please install Emscripten."
    echo "Run: cd /home/user && git clone https://github.com/emscripten-core/emsdk.git"
    echo "     cd emsdk && ./emsdk install latest && ./emsdk activate latest"
    exit 1
fi

echo "Emscripten version:"
emcc --version | head -1
echo ""

echo "Step 1: Building WebAssembly module..."
echo ""

# Clean previous build
rm -f necpp.js necpp.wasm

# Build using make
make

if [ ! -f necpp.js ] || [ ! -f necpp.wasm ]; then
    echo "✗ Build failed - output files not created"
    exit 1
fi

echo ""
echo "✓ Build successful"
ls -lh necpp.js necpp.wasm
echo ""

echo "Step 2: Testing with Node.js..."
echo ""

# Check for node
if ! command -v node &> /dev/null; then
    echo "WARNING: node not found, skipping JavaScript test"
    echo "Build completed successfully, but cannot test runtime"
    exit 0
fi

# Create a simple test
cat > test_wasm_runner.js << 'ENDJS'
const createNecppModule = require('./necpp.js');

async function runTest() {
    console.log('Loading NEC++ WebAssembly module...');

    try {
        const necModule = await createNecppModule();
        console.log('✓ Module loaded\n');

        console.log('Creating NEC++ context...');
        const nec = new necModule.NecppWrapper();
        console.log('✓ Context created\n');

        console.log('Defining half-wave dipole antenna...');
        nec.wire(1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
        console.log('✓ Wire defined\n');

        console.log('Completing geometry...');
        nec.geometryComplete(0);
        console.log('✓ Geometry complete\n');

        console.log('Setting frequency to 299.8 MHz...');
        nec.frCard(0, 1, 299.8, 0);
        console.log('✓ Frequency set\n');

        console.log('Adding voltage excitation...');
        nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);
        console.log('✓ Excitation added\n');

        console.log('Setting ground parameters (free space)...');
        nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
        console.log('✓ Ground parameters set\n');

        console.log('Calculating radiation pattern...');
        nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);
        console.log('✓ Radiation pattern calculated\n');

        console.log('Results:');
        console.log('--------');
        const gainMax = nec.getGainMax(0);
        const gainMin = nec.getGainMin(0);
        const gainMean = nec.getGainMean(0);
        const zReal = nec.getImpedanceReal(0);
        const zImag = nec.getImpedanceImag(0);

        console.log(`Maximum Gain:  ${gainMax.toFixed(2)} dBi`);
        console.log(`Minimum Gain:  ${gainMin.toFixed(2)} dBi`);
        console.log(`Mean Gain:     ${gainMean.toFixed(2)} dBi`);
        console.log(`Impedance:     ${zReal.toFixed(2)} + j${zImag.toFixed(2)} Ω`);

        const z0 = 50.0;
        const gammaMag = Math.sqrt(
            Math.pow(zReal - z0, 2) + Math.pow(zImag, 2)
        ) / Math.sqrt(
            Math.pow(zReal + z0, 2) + Math.pow(zImag, 2)
        );
        const swr = (1 + gammaMag) / (1 - gammaMag);
        console.log(`SWR (50Ω):     ${swr.toFixed(2)}:1\n`);

        console.log('Validation:');
        console.log('-----------');
        let allPass = true;

        if (gainMax > 1.5 && gainMax < 3.0) {
            console.log('✓ Gain is in expected range (1.5 to 3.0 dBi)');
        } else {
            console.log(`✗ WARNING: Gain ${gainMax.toFixed(2)} dBi is outside expected range`);
            allPass = false;
        }

        if (zReal > 50 && zReal < 90) {
            console.log('✓ Real impedance is in expected range (50 to 90 Ω)');
        } else {
            console.log(`✗ WARNING: Real impedance ${zReal.toFixed(2)} Ω is outside expected range`);
            allPass = false;
        }

        if (Math.abs(zImag) < 50) {
            console.log('✓ Imaginary impedance is in expected range (-50 to 50 Ω)');
        } else {
            console.log(`✗ WARNING: Imaginary impedance ${zImag.toFixed(2)} Ω is outside expected range`);
            allPass = false;
        }

        console.log('\nCleaning up...');
        nec.delete();
        console.log('✓ Context deleted\n');

        if (allPass) {
            console.log('✓✓✓ ALL VALIDATIONS PASSED ✓✓✓');
            process.exit(0);
        } else {
            console.log('⚠ SOME VALIDATIONS FAILED ⚠');
            process.exit(1);
        }

    } catch (error) {
        console.error('✗ ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

runTest();
ENDJS

# Run the test
node test_wasm_runner.js

TEST_RESULT=$?

# Cleanup
rm -f test_wasm_runner.js

if [ $TEST_RESULT -eq 0 ]; then
    echo ""
    echo "==================================="
    echo "✓ ALL TESTS PASSED"
    echo "==================================="
    exit 0
else
    echo ""
    echo "==================================="
    echo "✗ TESTS FAILED"
    echo "==================================="
    exit 1
fi
