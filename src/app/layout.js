'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'react-hot-toast'; // 1. Importa el componente Toaster
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head />
      <body className="min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            {/* 2. Añade el componente Toaster aquí */}
            <Toaster 
              position="top-right" // Puedes personalizar la posición
              toastOptions={{
                // Estilos opcionales para que coincida con tu tema
                className: 'dark:bg-gray-700 dark:text-white',
              }}
            />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}