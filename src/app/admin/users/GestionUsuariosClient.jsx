'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useRouter } from 'next/navigation'; // Importar useRouter para la navegación
import { Pencil, Trash2, XCircle, Star } from 'lucide-react'; // Importar iconos

// ... (El componente StatusToggle se queda igual)
function StatusToggle({ isChecked, onChange, disabled }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={isChecked} onChange={onChange} disabled={disabled} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-400 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  );
}


export default function GestionUsuariosClient() {
  const router = useRouter(); // Hook para navegar
  const { data: users, error, isLoading, mutate } = useSWR('/api/users', fetcher);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // ... (El estado del modal se queda igual)
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [premiumDates, setPremiumDates] = useState({ inicio: new Date(), fin: new Date() });
  
  // ... (El useEffect para filtrar se queda igual)
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


  // --- NUEVAS FUNCIONES Y ACTUALIZACIONES ---
  const handleToggleStatus = async (user) => { /* ... (sin cambios) */ };
  const handleUpdatePremium = async () => { /* ... (sin cambios) */ };
  const openPremiumModal = (user) => { /* ... (sin cambios) */ };

  // NUEVA FUNCIÓN: Eliminar Usuario
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
        mutate(); // Actualizar la lista
      } catch (err) {
        Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
      }
    }
  };

  // NUEVA FUNCIÓN: Quitar Premium
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
      {/* ... (Título y barra de búsqueda sin cambios) */}
       <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Gestión de Usuarios</h1>
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
                  {/* --- NUEVOS BOTONES DE ACCIÓN --- */}
                  <div className="flex justify-center items-center gap-2">
                     <button onClick={() => openPremiumModal(user)} title="Gestionar Premium" className="p-2 text-yellow-500 hover:text-yellow-400 rounded-full hover:bg-gray-700 transition">
                      <Star size={18} />
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

      {/* ... (El modal para las fechas premium se queda igual) */}
    </div>
  );
}