'use client';

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export default function UsersClient() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newSubscriptionDate, setNewSubscriptionDate] = useState(new Date());
  const [cantidadMeses, setCantidadMeses] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const { data: usersData, error, isLoading, mutate } = useSWR('/api/users', fetcher, {
    refreshInterval: 5000,
  });

  useEffect(() => {
    if (!usersData) return;
    const term = searchTerm.toLowerCase();
    setFilteredUsers(
      usersData.filter(user =>
        user.fullName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.profesion?.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, usersData]);

  const handleUpdateSubscription = async () => {
    await fetch('/api/update-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: selectedUser.id,
        fechaSuscripcion: newSubscriptionDate,
        cantidadMeses,
      }),
    });
    mutate();
    setShowModal(false);
    Swal.fire('Actualizado', 'La suscripción ha sido actualizada correctamente.', 'success');
  };

  const handleToggleActive = async (userId) => {
    await fetch('/api/toggle-active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    mutate();
    Swal.fire('Estado actualizado', 'El estado del usuario ha sido cambiado.', 'success');
  };

  const handleClearSubscription = async (user) => {
    const result = await Swal.fire({
      title: `¿Borrar suscripción de ${user.fullName}?`,
      text: 'Esta acción eliminará la suscripción actual del usuario.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#eab308',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      await fetch('/api/clear-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      mutate();
      Swal.fire('Suscripción eliminada', 'La suscripción ha sido eliminada correctamente.', 'success');
    }
  };

  if (isLoading) return <p>Cargando usuarios...</p>;
  if (error) return <p>Error al cargar usuarios.</p>;

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <button
          onClick={() => router.push('/admin/users/create')}
          className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded shadow-lg"
        >
          + Nuevo Usuario
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre, correo o profesión..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-4 p-2 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded shadow-lg">
          <thead>
            <tr className="bg-gray-700">
              <th className="py-3 px-4">Nombre</th>
              <th className="py-3 px-4">Nacimiento</th>
              <th className="py-3 px-4">Correo</th>
              <th className="py-3 px-4">Profesión</th>
              <th className="py-3 px-4">Premium</th>
              <th className="py-3 px-4">Activo</th>
              <th className="py-3 px-4">Inicio</th>
              <th className="py-3 px-4">Fin</th>
              <th className="py-3 px-4">Sexo</th>
              <th className="py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-700 transition">
                <td className="py-2 px-4">{user.fullName}</td>
                <td className="py-2 px-4">{user.fechaNacimiento}</td>
                <td className="py-2 px-4">{user.email}</td>
                <td className="py-2 px-4">{user.profesion}</td>
                <td className="py-2 px-4">{user.isPremium ? 'Sí' : 'No'}</td>
                <td className="py-2 px-4">{user.active ? 'Sí' : 'No'}</td>
                <td className="py-2 px-4">{user.fechaSuscripcion}</td>
                <td className="py-2 px-4">{user.fechaVencimiento}</td>
                <td className="py-2 px-4">{user.sexo}</td>
                <td className="py-2 px-4">
                  <div className="flex gap-2 justify-center">
                    <button
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                      onClick={() => {
                        setSelectedUser(user);
                        setNewSubscriptionDate(user.fechaSuscripcion ? new Date(user.fechaSuscripcion) : new Date());
                        setCantidadMeses(1);
                        setShowModal(true);
                      }}
                    >
                      Actualizar
                    </button>
                    <button
                      className={`${user.active ? 'bg-red-600' : 'bg-blue-600'} hover:scale-105 transform px-3 py-1 rounded`}
                      onClick={() => handleToggleActive(user.id)}
                    >
                      {user.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      className="bg-yellow-600 hover:bg-yellow-700 px-1 py-1 rounded"
                      onClick={() => handleClearSubscription(user)}
                    >
                      Borrar suscripción
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl w-80">
            <h2 className="text-2xl font-bold text-center mb-4">Actualizar Suscripción</h2>
            <label className="block mb-1">Fecha de suscripción:</label>
            <DatePicker
              selected={newSubscriptionDate}
              onChange={(date) => setNewSubscriptionDate(date)}
              dateFormat="yyyy-MM-dd"
              className="input mb-4"
            />
            <label className="block mb-1">Meses a pagar:</label>
            <select
              value={cantidadMeses}
              onChange={(e) => setCantidadMeses(Number(e.target.value))}
              className="input mb-4"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} mes{(i + 1) > 1 ? 'es' : ''}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                className="btn-primary"
                onClick={handleUpdateSubscription}
              >
                Guardar
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
