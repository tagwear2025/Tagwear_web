'use client';

import Link from 'next/link';
import { useAuth } from 'src/context/AuthContext';

export default function UserHomePage() {
  const { user, role } = useAuth();

  return (
    <section className="p-8">
      <h1 className="text-3xl font-bold mb-4">Bienvenido, {user.email}</h1>
      <p className="mb-6">Rol: {role}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/app/courses" className="card">
          <h2>Cursos</h2>
          <p>Productos Disponibles</p>
        </Link>
        <Link href="/app/profile" className="card">
          <h2>Productos Preminu</h2>
          <p>Productos Tendencia</p>
        </Link>
      </div>
    </section>
  );
}
