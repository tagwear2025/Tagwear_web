// next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
module.exports = {
  webpack(config) {
    // alias @  →  ./src
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },

  images: {
    remotePatterns: [
      // Tu configuración existente para las fotos de perfil de Google
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      // AÑADIDO: Configuración para las imágenes de Firebase Storage
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      // AÑADIDO: Configuración para las imágenes de placeholder
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
