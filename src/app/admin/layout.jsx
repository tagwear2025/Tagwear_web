// Archivo: src/app/admin/layout.jsx
// Problema: Importación incorrecta de NavbarAdmin
// Solución: Corregir la ruta de importación

'use client';
import { useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { useRouter } from 'next/navigation';
// CORRECCIÓN: Cambia la ruta de importación aquí
import NavbarAdmin from '@/app/components/layout/NavbarAdmin';

export default function AdminLayout({ children }) {
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const isAdmin = role === 'admin';
      if (!user) return router.replace('/login');
      if (!isAdmin) return router.replace('/app');
    }
  }, [loading, user, role, router]);

  if (loading || !user) return <div className="p-8">Cargando...</div>;

  return (
    <>
      <NavbarAdmin onSignOut={signOut} />
      <main>{children}</main>
    </>
  );
}