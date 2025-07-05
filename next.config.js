// next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
module.exports = {
  webpack(config) {
    // alias @  →  ./src
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },

  // SECCIÓN AÑADIDA PARA PERMITIR IMÁGENES DE GOOGLE
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Dominio de las fotos de perfil de Google
        port: '',
        pathname: '/**', // Permitir cualquier ruta de imagen dentro de ese dominio
      },
      // Si en el futuro usas otro proveedor de autenticación (ej. Facebook),
      // puedes añadir su dominio aquí.
    ],
  },
};