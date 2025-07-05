'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import Link from 'next/link'; // Importamos Link para el enlace a la página de login
import { useTheme } from '@/context/ThemeContext'; // Importamos el hook del tema
import { User, Calendar, Users, MapPin, Mail, Lock } from 'lucide-react'; // Importamos los iconos necesarios

// Componente de la página de registro
export default function RegisterPage() {
  const router = useRouter();
  const { isDark } = useTheme(); // Obtenemos el estado del tema para los pop-ups

  // Estado para manejar todos los campos del formulario (Tu lógica original)
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

  // Estado para controlar el proceso de envío y deshabilitar el botón (Tu lógica original)
  const [loading, setLoading] = useState(false);

  // Departamentos de Bolivia para el dropdown (Tu lógica original)
  const departamentos = [
    'Beni', 'Cochabamba', 'Chuquisaca', 'La Paz',
    'Oruro', 'Pando', 'Potosí', 'Santa Cruz', 'Tarija'
  ];

  // Manejador para actualizar el estado del formulario (Tu lógica original)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Manejador para el envío del formulario (Tu lógica original, con pop-ups adaptados al tema)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const { password, confirmPassword, ...otherFields } = formData;

    const emptyFields = Object.entries(otherFields).filter(([, value]) => value.trim() === '');
    if (emptyFields.length > 0 || !password || !confirmPassword) {
      await Swal.fire({
        icon: 'warning',
        title: 'Campos Incompletos',
        text: `Por favor, rellena todos los campos.`,
        confirmButtonColor: '#3085d6',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827'
      });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      await Swal.fire({
        icon: 'error',
        title: 'Error en la Contraseña',
        text: 'Las contraseñas no coinciden. Por favor, inténtalo de nuevo.',
        confirmButtonColor: '#d33',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827'
      });
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      await Swal.fire({
        icon: 'warning',
        title: 'Contraseña Débil',
        text: 'La contraseña debe tener al menos 6 caracteres.',
        confirmButtonColor: '#3085d6',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827'
      });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        fechaNacimiento: formData.fechaNacimiento,
        sexo: formData.sexo,
        lugarResidencia: formData.lugarResidencia,
        email: formData.email,
        password: formData.password,
        estadoCuenta: true,
      };
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ocurrió un error al registrar la cuenta.');
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Registro Exitoso!',
        text: 'Tu cuenta ha sido creada correctamente. Ahora serás redirigido al login.',
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827'
      });

      router.push('/login');

    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error en el Registro',
        text: error.message,
        confirmButtonColor: '#d33',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Estilo base reutilizable para todos los inputs y selects
  const inputStyle = "w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-gray-900 dark:text-gray-100";

  // --- JSX COMPLETAMENTE REDISEÑADO ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-4xl p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            CREAR CUENTA PARA USUARIOS
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Crea una cuenta manualmente para usuarios que no tienen acceso.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
          {/* --- Sección de Información Personal --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <h2 className="md:col-span-2 text-xl font-semibold text-gray-800 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700">
              Datos Personales
            </h2>
            <div className="relative flex items-center">
              <User className="absolute left-3 text-gray-400" size={20} />
              <input id="nombres" name="nombres" type="text" value={formData.nombres} onChange={handleChange} placeholder="Nombres" className={inputStyle} required />
            </div>
            <div className="relative flex items-center">
              <User className="absolute left-3 text-gray-400" size={20} />
              <input id="apellidos" name="apellidos" type="text" value={formData.apellidos} onChange={handleChange} placeholder="Apellidos" className={inputStyle} required />
            </div>
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 text-gray-400" size={20} />
              <input id="fechaNacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleChange} className={inputStyle + " text-gray-500"} required />
            </div>
            <div className="relative flex items-center">
              <Users className="absolute left-3 text-gray-400" size={20} />
              <select id="sexo" name="sexo" value={formData.sexo} onChange={handleChange} className={inputStyle} required>
                <option value="" disabled>Selecciona tu sexo...</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Prefiero no decirlo">Prefiero no decirlo</option>
              </select>
            </div>
            <div className="md:col-span-2 relative flex items-center">
              <MapPin className="absolute left-3 text-gray-400" size={20} />
              <select id="lugarResidencia" name="lugarResidencia" value={formData.lugarResidencia} onChange={handleChange} className={inputStyle} required>
                <option value="" disabled>Departamento de residencia...</option>
                {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
              </select>
            </div>
          </div>
          
          {/* --- Sección de Credenciales --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <h2 className="md:col-span-2 text-xl font-semibold text-gray-800 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700">
              Datos de la Cuenta
            </h2>
            <div className="md:col-span-2 relative flex items-center">
              <Mail className="absolute left-3 text-gray-400" size={20} />
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Correo Electrónico" className={inputStyle} required />
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 text-gray-400" size={20} />
              <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Contraseña (mín. 6 caracteres)" className={inputStyle} required />
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 text-gray-400" size={20} />
              <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirmar Contraseña" className={inputStyle} required />
            </div>
          </div>

          {/* --- Botón de Envío y Enlace a Login --- */}
          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}