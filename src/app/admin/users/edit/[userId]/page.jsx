'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Swal from 'sweetalert2';
import { fetcher } from '@/lib/fetcher';

// Componente de la página de edición de usuario
export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { userId } = params;

  // 1. Obtener los datos del usuario a editar
  const { data: userData, error: userError, isLoading } = useSWR(userId ? `/api/users/${userId}` : null, fetcher);

  // 2. Estado para manejar el formulario
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    sexo: '',
    lugarResidencia: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. Pre-rellenar el formulario cuando los datos del usuario se carguen
  useEffect(() => {
    if (userData) {
      setFormData({
        nombres: userData.nombres || '',
        apellidos: userData.apellidos || '',
        fechaNacimiento: userData.fechaNacimiento || '',
        sexo: userData.sexo || '',
        lugarResidencia: userData.lugarResidencia || '',
      });
    }
  }, [userData]);

  // Departamentos de Bolivia
  const departamentos = ['Beni', 'Cochabamba', 'Chuquisaca', 'La Paz', 'Oruro', 'Pando', 'Potosí', 'Santa Cruz', 'Tarija'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...formData }),
      });

      if (!response.ok) {
        throw new Error('No se pudo actualizar el usuario.');
      }
      
      await Swal.fire('¡Actualizado!', 'Los datos del usuario han sido actualizados.', 'success');
      router.push('/admin/users'); // Volver a la lista de usuarios

    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Cargando datos del usuario...</div>;
  if (userError) return <div className="p-8 text-center text-red-500">Error: No se pudo cargar al usuario.</div>;
  if (!userData) return <div className="p-8 text-center">Usuario no encontrado.</div>;


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Editar Usuario
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">{userData.email}</p>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Nombres */}
          <div className="md:col-span-1">
            <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombres</label>
            <input id="nombres" name="nombres" type="text" value={formData.nombres} onChange={handleChange} className="input-style" required />
          </div>

          {/* Apellidos */}
          <div className="md:col-span-1">
            <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellidos</label>
            <input id="apellidos" name="apellidos" type="text" value={formData.apellidos} onChange={handleChange} className="input-style" required />
          </div>

          {/* Fecha de Nacimiento */}
          <div className="md:col-span-1">
            <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Nacimiento</label>
            <input id="fechaNacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleChange} className="input-style" required />
          </div>

          {/* Sexo */}
          <div className="md:col-span-1">
            <label htmlFor="sexo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sexo</label>
            <select id="sexo" name="sexo" value={formData.sexo} onChange={handleChange} className="input-style" required>
              <option value="" disabled>Selecciona...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Prefiero no decirlo">Prefiero no decirlo</option>
            </select>
          </div>

          {/* Lugar de Residencia */}
          <div className="md:col-span-2">
            <label htmlFor="lugarResidencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lugar de Residencia</label>
            <select id="lugarResidencia" name="lugarResidencia" value={formData.lugarResidencia} onChange={handleChange} className="input-style" required>
              <option value="" disabled>Selecciona...</option>
              {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>
          
          {/* Botones de acción */}
          <div className="md:col-span-2 mt-6 flex gap-4">
             <button type="button" onClick={() => router.push('/admin/users')} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Asegúrate de que tu `globals.css` tenga una clase `input-style` definida,
// ya que el formulario de registro y este la usan. Por ejemplo:
// .input-style {
//   @apply block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500;
// }