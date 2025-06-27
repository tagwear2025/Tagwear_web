// src/app/register/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

// Componente de la página de registro
export default function RegisterPage() {
  const router = useRouter();

  // Estado para manejar todos los campos del formulario
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    sexo: '',
    lugarResidencia: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Estado para controlar el proceso de envío y deshabilitar el botón
  const [loading, setLoading] = useState(false);

  // Departamentos de Bolivia para el dropdown
  const departamentos = [
    'Beni', 'Cochabamba', 'Chuquisaca', 'La Paz',
    'Oruro', 'Pando', 'Potosí', 'Santa Cruz', 'Tarija'
  ];

  // Manejador para actualizar el estado del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Manejador para el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Evita envíos múltiples si ya se está procesando
    setLoading(true);

    // --- Validación del Frontend ---
    const { password, confirmPassword, ...otherFields } = formData;

    // 1. Validar que no haya campos vacíos (excepto confirmPassword)
    const emptyFields = Object.entries(otherFields).filter(([, value]) => value.trim() === '');
    if (emptyFields.length > 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Campos Incompletos',
        text: `Por favor, rellena todos los campos.`,
        confirmButtonColor: '#3085d6',
      });
      setLoading(false);
      return;
    }

    // 2. Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      await Swal.fire({
        icon: 'error',
        title: 'Error en la Contraseña',
        text: 'Las contraseñas no coinciden. Por favor, inténtalo de nuevo.',
        confirmButtonColor: '#d33',
      });
      setLoading(false);
      return;
    }
    
    // 3. Validar longitud mínima de la contraseña
    if (password.length < 6) {
      await Swal.fire({
        icon: 'warning',
        title: 'Contraseña Débil',
        text: 'La contraseña debe tener al menos 6 caracteres.',
        confirmButtonColor: '#3085d6',
      });
      setLoading(false);
      return;
    }

    // --- Envío a la API ---
    try {
      // Prepara los datos a enviar, excluyendo confirmPassword
      const payload = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        fechaNacimiento: formData.fechaNacimiento,
        sexo: formData.sexo,
        lugarResidencia: formData.lugarResidencia,
        email: formData.email,
        password: formData.password,
        estadoCuenta: true, // Campo invisible por defecto
      };
      
      const response = await fetch('/api/register', { // Asegúrate de crear este endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // Lanza un error con el mensaje de la API si está disponible
        throw new Error(result.error || 'Ocurrió un error al registrar la cuenta.');
      }

      // Si todo fue bien, muestra alerta de éxito y redirige
      await Swal.fire({
        icon: 'success',
        title: '¡Registro Exitoso!',
        text: 'Tu cuenta ha sido creada correctamente. Ahora serás redirigido al login.',
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
      });

      router.push('/login');

    } catch (error) {
      // Muestra una alerta de error genérica o la que viene de la API
      await Swal.fire({
        icon: 'error',
        title: 'Error en el Registro',
        text: error.message,
        confirmButtonColor: '#d33',
      });
    } finally {
      // Se asegura de que el botón se vuelva a habilitar, incluso si hay un error
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Crear una Cuenta
        </h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          
          {/* Nombres */}
          <div className="md:col-span-1">
            <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombres
            </label>
            <input
              id="nombres"
              name="nombres"
              type="text"
              value={formData.nombres}
              onChange={handleChange}
              placeholder="Ej: Juan Carlos"
              className="input-style"
              required
            />
          </div>

          {/* Apellidos */}
          <div className="md:col-span-1">
            <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Apellidos
            </label>
            <input
              id="apellidos"
              name="apellidos"
              type="text"
              value={formData.apellidos}
              onChange={handleChange}
              placeholder="Ej: Pérez González"
              className="input-style"
              required
            />
          </div>

          {/* Fecha de Nacimiento */}
          <div className="md:col-span-1">
            <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de Nacimiento
            </label>
            <input
              id="fechaNacimiento"
              name="fechaNacimiento"
              type="date"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              className="input-style"
              required
            />
          </div>

          {/* Sexo */}
          <div className="md:col-span-1">
            <label htmlFor="sexo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sexo
            </label>
            <select
              id="sexo"
              name="sexo"
              value={formData.sexo}
              onChange={handleChange}
              className="input-style"
              required
            >
              <option value="" disabled>Selecciona una opción...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Prefiero no decirlo">Prefiero no decirlo</option>
            </select>
          </div>

          {/* Lugar de Residencia */}
          <div className="md:col-span-2">
            <label htmlFor="lugarResidencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Lugar donde Vives
            </label>
            <select
              id="lugarResidencia"
              name="lugarResidencia"
              value={formData.lugarResidencia}
              onChange={handleChange}
              className="input-style"
              required
            >
              <option value="" disabled>Selecciona un departamento...</option>
              {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>
          
          {/* Correo Electrónico */}
          <div className="md:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu-correo@ejemplo.com"
              className="input-style"
              required
            />
          </div>

          {/* Contraseña */}
          <div className="md:col-span-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              className="input-style"
              required
            />
          </div>

          {/* Confirmar Contraseña */}
          <div className="md:col-span-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repite la contraseña"
              className="input-style"
              required
            />
          </div>

          {/* Botón de envío */}
          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Ya tienes una cuenta?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Para usar los estilos comunes en los inputs, puedes definirlos en tu archivo global.css
// O simplemente asegúrate de tener una clase base como `input-style`
// .input-style {
//   @apply mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 dark:text-white
//   focus:outline-none focus:ring-blue-500 focus:border-blue-500;
// }