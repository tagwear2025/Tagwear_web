// src/app/layout.js (Corregido para importar AuthContext desde la ubicación correcta)
'use client';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css'; // Asegúrate de que esta importación es correcta

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head />
      <body className="min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}