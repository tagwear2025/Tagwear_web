'use client';
import { useAuth } from 'src/context/AuthContext';
import Link from 'next/link';

export default function AdminHomePage() {
  // Obtenemos el usuario del contexto
  const { user } = useAuth();

  // LA CORRECCIÓN ESTÁ AQUÍ:
  // Si `user` aún no está disponible, podemos mostrar un estado de carga o simplemente no renderizar nada.
  // Esto evita el error al intentar acceder a `user.email` cuando `user` es `null`.
  if (!user) {
    // Puedes poner un loader más elegante aquí si quieres
    return <div className="p-8">Cargando datos del usuario...</div>; 
  }
  
  // Si el código llega a este punto, es 100% seguro que `user` no es `null`.
  return (
    <section className="p-8 bg-gray-100 dark:bg-gray-800 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Panel Admin</h1>
      {/* Ahora esta línea es segura */}
      <p className="mb-6">Administrador: {user.email}</p>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/users" className="card">
          <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
          <p>Crear, editar y eliminar usuarios.</p>
        </Link>
        <Link href="/admin/qr-gestion" className="card">
          <h2 className="text-xl font-semibold">Gestión de QRs</h2>
          <p>Administrar los códigos QR de los clientes.</p>
        </Link>
        <Link href="/admin/solicitudes" className="card">
          <h2 className="text-xl font-semibold">Solicitudes</h2>
          <p>Ver y gestionar las solicitudes pendientes.</p>
        </Link>
      </div>
    </section>
  );
}
