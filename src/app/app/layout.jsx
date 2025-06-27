// src/app/app/layout.jsx
'use client';
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import NavbarUser from '@/app/components/layout/NavbarUser';

export default function UserLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // La lógica de efecto para redirigir si no hay usuario es correcta.
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // LA CORRECCIÓN ESTÁ AQUÍ:
  // Solo mostramos el loader mientras el contexto está verificando al usuario.
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  // Si no está cargando y hay un usuario, el useEffect no habrá redirigido.
  // Es seguro renderizar el contenido.
  if (user) {
    return <NavbarUser>{children}</NavbarUser>;
  }

  // Si no está cargando y no hay usuario, el useEffect ya está redirigiendo.
  // Devolvemos null o un loader para evitar renderizar nada mientras ocurre la redirección.
  return (
    <div className="flex justify-center items-center min-h-screen">
      <p>Redirigiendo...</p>
    </div>
  );
}