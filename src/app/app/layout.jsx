// src/app/app/layout.jsx
'use client';

import { useAuth } from 'src/context/AuthContext';
import NavbarUser from '@/app/components/layout/NavbarUser';
import { ThemeProvider } from '@/context/ThemeContext';

export default function AppLayout({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-xl font-medium text-gray-700 dark:text-gray-300 animate-pulse">
          Cargando tu espacio...
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        {/* El Navbar ahora es inteligente y se posiciona solo */}
        <NavbarUser />
        
        {/* El contenedor principal del contenido.
          - `pb-20`: Añade un padding en la parte inferior en móviles para dejar espacio al navbar.
          - `md:pb-0`: Quita ese padding en pantallas más grandes, ya que el navbar está arriba.
        */}
        <main className="pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
