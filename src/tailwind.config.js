/** @type {import('tailwindcss').Config} */
const config = {
  // Aquí está la clave: le decimos a Tailwind que escanee todos estos archivos.
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Habilitamos el modo oscuro para que funcione con la clase 'dark' en el <html>
  darkMode: 'class',
  theme: {
    extend: {
      // Aquí puedes extender el tema si lo necesitas en el futuro
    },
  },
  plugins: [],
};

export default config;