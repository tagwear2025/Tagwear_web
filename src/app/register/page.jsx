'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import { User, Calendar, Users, MapPin, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

// Componente de la página de registro
export default function RegisterPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  
  // --- NUEVO ESTADO PARA MANEJAR LAS PESTAÑAS ---
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' o 'cuenta'

  // Tu lógica de estado original, sin cambios.
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
  const [loading, setLoading] = useState(false);

  // Tu array de departamentos original
  const departamentos = [
    'Beni', 'Cochabamba', 'Chuquisaca', 'La Paz',
    'Oruro', 'Pando', 'Potosí', 'Santa Cruz', 'Tarija'
  ];

  // Tu manejador de cambios original
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value, }));
  };

  // --- NUEVA FUNCIÓN PARA VALIDAR EL PASO 1 Y AVANZAR ---
  const handleNextStep = () => {
    const personalFields = ['nombres', 'apellidos', 'fechaNacimiento', 'sexo', 'lugarResidencia'];
    const missingFields = personalFields.filter(field => !formData[field].trim());

    if (missingFields.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Incompletos',
        text: 'Por favor, completa todos los datos personales para continuar.',
        confirmButtonColor: '#3085d6',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827'
      });
      return;
    }
    setActiveTab('cuenta');
  };


  // Tu manejador de envío original, sin cambios en la lógica.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const { password, confirmPassword, ...otherFields } = formData;

    const emptyFields = Object.entries(otherFields).filter(([, value]) => value.trim() === '');
    if (emptyFields.length > 0 || !password || !confirmPassword) {
      await Swal.fire({
        icon: 'warning', title: 'Campos Incompletos', text: `Por favor, rellena todos los campos.`, confirmButtonColor: '#3085d6', background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f9fafb' : '#111827'
      });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      await Swal.fire({
        icon: 'error', title: 'Error en la Contraseña', text: 'Las contraseñas no coinciden. Por favor, inténtalo de nuevo.', confirmButtonColor: '#d33', background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f9fafb' : '#111827'
      });
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      await Swal.fire({
        icon: 'warning', title: 'Contraseña Débil', text: 'La contraseña debe tener al menos 6 caracteres.', confirmButtonColor: '#3085d6', background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f9fafb' : '#111827'
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ocurrió un error al registrar la cuenta.');
      }

      await Swal.fire({
        icon: 'success', title: '¡Registro Exitoso!', text: 'Tu cuenta ha sido creada correctamente. Ahora serás redirigido al login.', timer: 2000, showConfirmButton: false, timerProgressBar: true, background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f9fafb' : '#111827'
      });

      router.push('/login');

    } catch (error) {
      await Swal.fire({
        icon: 'error', title: 'Error en el Registro', text: error.message, confirmButtonColor: '#d33', background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f9fafb' : '#111827'
      });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500";
  const tabStyle = "flex-1 py-2.5 text-center text-sm font-medium rounded-lg cursor-pointer transition-colors";
  const activeTabStyle = "bg-blue-600 text-white shadow";
  const inactiveTabStyle = "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600";
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Crea tu Cuenta</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Sigue los pasos para unirte a Tagwear.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
          {/* --- Barra de Pestañas y Progreso --- */}
          <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl mb-8">
            <button type="button" onClick={() => setActiveTab('personal')} className={`${tabStyle} ${activeTab === 'personal' ? activeTabStyle : inactiveTabStyle}`}>
              Paso 1: Datos Personales
            </button>
            <button type="button" onClick={handleNextStep} className={`${tabStyle} ${activeTab === 'cuenta' ? activeTabStyle : inactiveTabStyle}`}>
              Paso 2: Datos de Cuenta
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* --- Pestaña 1: Datos Personales --- */}
            {activeTab === 'personal' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombres</label>
                    <User className="absolute bottom-3.5 left-3 text-gray-400" size={20} />
                    <input id="nombres" name="nombres" type="text" value={formData.nombres} onChange={handleChange} placeholder="Ej: Juan Carlos" className={inputStyle} required />
                  </div>
                  <div className="relative">
                    <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellidos</label>
                    <User className="absolute bottom-3.5 left-3 text-gray-400" size={20} />
                    <input id="apellidos" name="apellidos" type="text" value={formData.apellidos} onChange={handleChange} placeholder="Ej: Pérez González" className={inputStyle} required />
                  </div>
                  <div className="relative">
                    <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Nacimiento</label>
                    <Calendar className="absolute bottom-3.5 left-3 text-gray-400" size={20} />
                    <input id="fechaNacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleChange} className={inputStyle + " text-gray-500 dark:text-gray-400"} required />
                  </div>
                  <div className="relative">
                    <label htmlFor="sexo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sexo</label>
                    <Users className="absolute bottom-3.5 left-3 text-gray-400" size={20} />
                    <select id="sexo" name="sexo" value={formData.sexo} onChange={handleChange} className={inputStyle} required>
                      <option value="" disabled>Selecciona una opción...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 relative">
                    <label htmlFor="lugarResidencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lugar de Residencia</label>
                    <MapPin className="absolute bottom-3.5 left-3 text-gray-400" size={20} />
                    <select id="lugarResidencia" name="lugarResidencia" value={formData.lugarResidencia} onChange={handleChange} className={inputStyle} required>
                      <option value="" disabled>Selecciona un departamento...</option>
                      {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button type="button" onClick={handleNextStep} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                    Siguiente <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            )}
            
            {/* --- Pestaña 2: Datos de la Cuenta --- */}
            {activeTab === 'cuenta' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="relative">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                  <Mail className="absolute bottom-3.5 left-3 text-gray-400" size={20} />
                  <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="tu-correo@ejemplo.com" className={inputStyle} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
                    <Lock className="absolute bottom-3.5 left-3 text-gray-400" size={20} />
                    <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" className={inputStyle} required />
                  </div>
                  <div className="relative">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Contraseña</label>
                    <Lock className="absolute bottom-3.5 left-3 text-gray-400" size={20} />
                    <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Repite la contraseña" className={inputStyle} required />
                  </div>
                </div>
                <div className="pt-4 flex justify-between">
                  <button type="button" onClick={() => setActiveTab('personal')} className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <ArrowLeft size={20} /> Anterior
                  </button>
                  <button type="submit" disabled={loading} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-wait">
                    {loading ? 'Finalizando...' : 'Crear Cuenta'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}