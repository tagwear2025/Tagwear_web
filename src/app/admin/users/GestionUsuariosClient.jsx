'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
// AÑADIDO: Eye para el nuevo botón de ver perfil. QUITADO: Star.
import { Pencil, Trash2, XCircle, UserPlus, Eye } from 'lucide-react';

function StatusToggle({ isChecked, onChange, disabled }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={isChecked} onChange={onChange} disabled={disabled} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-400 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  );
}

export default function GestionUsuariosClient() {
  const router = useRouter();
  const { data: users, error, isLoading, mutate } = useSWR('/api/users', fetcher);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (users) {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(users.filter(user =>
          (user.nombres?.toLowerCase() || '').includes(term) ||
          (user.apellidos?.toLowerCase() || '').includes(term) ||
          (user.email?.toLowerCase() || '').includes(term)
      ));
    }
  }, [searchTerm, users]);

  const handleToggleStatus = async (user) => {
    const originalStatus = user.active;
    // Optimistic UI: Actualiza la UI inmediatamente
    mutate(
      users.map(u => u.id === user.id ? { ...u, active: !originalStatus } : u),
      false // no revalidar inmediatamente
    );

    const promise = fetch('/api/toggle-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });

    toast.promise(promise, {
      loading: 'Actualizando estado...',
      success: `Estado de ${user.nombres} actualizado.`,
      error: (err) => {
        // Si hay un error, revierte la UI al estado original
        mutate(
          users.map(u => u.id === user.id ? { ...u, active: originalStatus } : u),
          false
        );
        return 'No se pudo actualizar el estado.';
      }
    });
  };

  const handleDeleteUser = async (user) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Esta acción eliminará a ${user.nombres} ${user.apellidos} permanentemente. ¡No se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, ¡eliminar!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await fetch('/api/users/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        Swal.fire('Eliminado', 'El usuario ha sido eliminado.', 'success');
        mutate();
      } catch (err) {
        Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
      }
    }
  };

  const handleClearPremium = async (user) => {
    const result = await Swal.fire({
      title: 'Quitar Premium',
      text: `¿Seguro que quieres eliminar la suscripción premium de ${user.nombres}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await fetch('/api/users/clear-premium', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            Swal.fire('Hecho', 'Se ha eliminado la suscripción premium.', 'success');
            mutate();
        } catch (err) {
            Swal.fire('Error', 'No se pudo eliminar la suscripción.', 'error');
        }
    }
  };

  if (isLoading) return <div className="p-8 text-center">Cargando usuarios...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error al cargar datos.</div>;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
        <Link href="/admin/users/Create" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow">
          <UserPlus size={20} />
          <span>Crear Usuario</span>
        </Link>
      </div>
      
      <input
        type="text"
        placeholder="Buscar por nombre, apellido o correo..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-6 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Nombre</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3 text-center">Estado</th>
              <th scope="col" className="px-6 py-3">Premium</th>
              <th scope="col" className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers?.map((user) => (
              <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.nombres} {user.apellidos}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4 text-center">
                  <StatusToggle isChecked={user.active} onChange={() => handleToggleStatus(user)} />
                </td>
                <td className="px-6 py-4">
                  {user.fechaSuscripcion ? `${user.fechaSuscripcion} - ${user.fechaVencimiento}` : 'No'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center items-center gap-2">
                    {/* --- BOTÓN AÑADIDO --- */}
                    <button onClick={() => router.push(`/admin/users/view/${user.id}`)} title="Ver Perfil" className="p-2 text-green-500 hover:text-green-400 rounded-full hover:bg-gray-700 transition">
                      <Eye size={18} />
                    </button>

                    {user.fechaSuscripcion && (
                      <button onClick={() => handleClearPremium(user)} title="Quitar Premium" className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition">
                        <XCircle size={18} />
                      </button>
                    )}
                    <button onClick={() => router.push(`/admin/users/edit/${user.id}`)} title="Editar Usuario" className="p-2 text-blue-500 hover:text-blue-400 rounded-full hover:bg-gray-700 transition">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDeleteUser(user)} title="Eliminar Usuario" className="p-2 text-red-500 hover:text-red-400 rounded-full hover:bg-gray-700 transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Componente para mostrar las notificaciones toast */}
      <Toaster position="bottom-right" />
    </div>
  );
}
