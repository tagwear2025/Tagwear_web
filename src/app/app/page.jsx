'use client';

import { useAuth } from 'src/context/AuthContext';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext'; // Importamos el hook de tema para consistencia visual

export default function AdminHomePage() {
  // 1. Obtenemos user Y loading del contexto. ¡Esto es clave!
  const { user, loading } = useAuth();
  const { isDark } = useTheme();

  // 2. Primero, manejamos el estado de carga.
  // Mientras loading sea true, mostramos un indicador.
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-8 bg-gray-100 dark:bg-gray-800">
        <p className="text-xl animate-pulse">Cargando datos del administrador...</p>
      </div>
    );
  }

  // 3. Después de que la carga ha terminado (loading es false),
  // verificamos si el usuario existe. Si no, es un estado inesperado.
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen p-8 bg-gray-100 dark:bg-gray-800">
        <p className="text-xl text-red-500">No se pudo autenticar al usuario. Redirigiendo...</p>
      </div>
    );
  }

  // 4. Si el código llega aquí, es 100% seguro que loading es false y user existe.
  return (
    <section className="p-6 sm:p-8 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Panel de Administración
            </h1>
            <p className="text-md text-gray-600 dark:text-gray-400 mb-8">
                Bienvenido, <span className="font-semibold">{user.displayName || user.email}</span>.
            </p>

            {/* Grid de tarjetas de navegación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/admin/users" className={`p-6 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}>
                    <h2 className="text-xl font-bold text-blue-500 dark:text-blue-400 mb-2">Gestión de Usuarios</h2>
                    <p className="text-gray-600 dark:text-gray-300">Crear, editar, activar y eliminar usuarios.</p>
                </Link>

                <Link href="/admin/solicitudes" className={`p-6 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}>
                    <h2 className="text-xl font-bold text-green-500 dark:text-green-400 mb-2">Solicitudes y Premium</h2>
                    <p className="text-gray-600 dark:text-gray-300">Gestionar solicitudes y suscripciones.</p>
                </Link>

                <Link href="/admin/qr-gestion" className={`p-6 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}>
                    <h2 className="text-xl font-bold text-purple-500 dark:text-purple-400 mb-2">Gestión de QR</h2>
                    <p className="text-gray-600 dark:text-gray-300">Administrar los códigos QR de los clientes.</p>
                </Link>
            </div>
        </div>
    </section>
  );
}