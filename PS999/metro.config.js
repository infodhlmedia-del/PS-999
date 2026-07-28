const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for "Unable to resolve call-bind/callBound" error
// Forces Metro to resolve call-bind from root node_modules
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'call-bind': path.resolve(__dirname, 'node_modules/call-bind'),
};

module.exports = config;
