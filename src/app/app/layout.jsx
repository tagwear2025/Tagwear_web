// src/app/app/layout.jsx
'use client';
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import NavbarUser from '@/app/components/layout/NavbarUser';  // <-- Importa NavbarUser aquí

export default function UserLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Redirigiendo al login...</p>
      </div>
    );
  }

  // Aquí sí existe NavbarUser, porque lo has importado arriba
  return <NavbarUser>{children}</NavbarUser>;
}
