'use client';

import { useAuth } from '@/context/AuthContext';
import NavbarUser from '@/app/components/layout/NavbarUser';

export default function AppLayout({ children }) {
  const { user, loading } = useAuth();

  // Guarda de seguridad: Muestra "Cargando..." mientras se verifica la sesión.
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-xl font-medium text-gray-700 dark:text-gray-300 animate-pulse">
          Cargando tu espacio...
        </div>
      </div>
    );
  }

  // Una vez verificado, se muestra el contenido. NO necesita ThemeProvider.
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <NavbarUser />
      <main className="pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
