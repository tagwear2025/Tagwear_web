// next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
module.exports = {
  webpack(config) {
    // alias @  →  ./src
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  }
};
