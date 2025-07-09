// src/app/admin/layout.jsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import NavbarAdmin from '@/app/components/layout/NavbarAdmin';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react'; // Importar Loader

export default function AdminLayout({ children }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Si la carga terminó y el usuario no es un admin, redirigir.
      if (!user || role !== 'admin') {
        router.replace('/login');
      }
    }
  }, [user, role, loading, router]);

  // Muestra un spinner de carga mientras 'loading' es true o si el rol aún no es 'admin'.
  // Esto previene que el contenido se muestre prematuramente.
  if (loading || role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <Loader className="w-12 h-12 animate-spin text-blue-400" />
        <p className="mt-4 text-lg font-medium">Verificando acceso de administrador...</p>
      </div>
    );
  }
  
  // Si la carga terminó y el rol es 'admin', renderizamos el panel.
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarAdmin>
        {children}
      </NavbarAdmin>
    </div>
  );
}
