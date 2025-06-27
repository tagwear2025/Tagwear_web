'use client';

import Link from 'next/link';
import { useAuth } from 'src/context/AuthContext';

export default function AdminHomePage() {
  const { user } = useAuth();

  return (
    <section className="p-8 bg-gray-100 dark:bg-gray-800 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Panel Admin</h1>
      <p className="mb-6">Administrador: {user.email}</p>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/users" className="card">
          <h2>Usuarios</h2>
          <p>Gestiona cuentas de estudiantes</p>
        </Link>
        <Link href="/admin/courses" className="card">
          <h2>Cursos</h2>
          <p>Crea o modifica los cursos</p>
        </Link>
        <Link href="/admin/settings" className="card">
          <h2>Configuración</h2>
          <p>Ajustes globales del sistema</p>
        </Link>
      </div>
    </section>
  );
}
