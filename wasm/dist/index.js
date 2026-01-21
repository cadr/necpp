/**
 * NEC++ WebAssembly Module
 *
 * Main entry point for the NEC++ electromagnetic antenna simulation library
 */

const createNecppModule = require('./necpp.js');

module.exports = createNecppModule;
module.exports.default = createNecppModule;
