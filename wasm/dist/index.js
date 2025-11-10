/**
 * NEC++ WebAssembly Module
 *
 * Main entry point for the NEC++ electromagnetic antenna simulation library
 *
 * @example
 * const createNecppModule = require('@necpp/wasm');
 *
 * async function simulate() {
 *   const Module = await createNecppModule();
 *   const nec = new Module.NecppWrapper();
 *
 *   try {
 *     // Define a half-wave dipole
 *     nec.wire(1, 11, 0, 0, -0.25, 0, 0, 0.25, 0.001, 1.0, 1.0);
 *     nec.geometryComplete(0);
 *     nec.frCard(0, 1, 299.8, 0);
 *     nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);
 *     nec.gnCard(-1, 0, 0, 0, 0, 0, 0, 0);
 *     nec.rpCard(0, 91, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0);
 *
 *     console.log('Gain:', nec.getGainMax(0), 'dBi');
 *   } finally {
 *     nec.delete();
 *   }
 * }
 */

const path = require('path');
const fs = require('fs');

// Check if necpp.js exists in the same directory
const necppPath = path.join(__dirname, 'necpp.js');

if (!fs.existsSync(necppPath)) {
  throw new Error(
    'necpp.js not found! The WASM files need to be built.\n' +
    'Please run:\n' +
    '  cd ' + path.dirname(__dirname) + '\n' +
    '  npm run build:docker  (or make if you have Emscripten)\n' +
    '  ./prepare-dist.sh'
  );
}

const createNecppModule = require('./necpp.js');

module.exports = createNecppModule;
module.exports.default = createNecppModule;
