'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { User, Calendar, Users, MapPin, Mail, Lock, ArrowRight, ArrowLeft, X } from 'lucide-react';

// --- Componentes de Formulario Adaptados para el Panel de Admin ---

const FormInput = ({ id, name, type = 'text', value, onChange, placeholder, icon, required = true, label }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
        <div className="relative">
            {icon && <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">{icon}</div>}
            <input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${type === 'date' && !value ? 'text-gray-500' : ''}`}
            />
        </div>
    </div>
);

const FormSelect = ({ id, name, value, onChange, icon, children, required = true, label }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
        <div className="relative">
            {icon && <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">{icon}</div>}
            <select
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 appearance-none ${!value ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}
            >
                {children}
            </select>
        </div>
    </div>
);

export default function CreateUserPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('personal');
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
    const departamentos = [
        'Beni', 'Cochabamba', 'Chuquisaca', 'La Paz', 'Oruro', 'Pando', 'Potosí', 'Santa Cruz', 'Tarija'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleNextStep = () => {
        const personalFields = ['nombres', 'apellidos', 'fechaNacimiento', 'sexo', 'lugarResidencia'];
        const missingFields = personalFields.filter(field => !formData[field].trim());
        if (missingFields.length > 0) {
            Swal.fire({
                icon: 'warning', title: 'Campos Incompletos',
                text: 'Por favor, completa todos los datos personales para continuar.',
                background: '#1f2937', color: '#ffffff'
            });
            return;
        }
        setActiveTab('cuenta');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        const { password, confirmPassword } = formData;

        if (password !== confirmPassword) {
            await Swal.fire({ icon: 'error', title: 'Error', text: 'Las contraseñas no coinciden.', background: '#1f2937', color: '#ffffff' });
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            await Swal.fire({ icon: 'warning', title: 'Contraseña Débil', text: 'La contraseña debe tener al menos 6 caracteres.', background: '#1f2937', color: '#ffffff' });
            setLoading(false);
            return;
        }

        try {
            // El payload es idéntico al del registro público
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

            // ✅ CORRECCIÓN: Llamamos a la misma API que el registro público para asegurar consistencia
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Ocurrió un error al crear la cuenta.');
            }

            await Swal.fire({
                icon: 'success', title: '¡Usuario Creado!',
                text: 'La cuenta ha sido creada exitosamente.',
                timer: 2000, showConfirmButton: false, timerProgressBar: true,
                background: '#1f2937', color: '#ffffff'
            });
            router.push('/admin/users'); // Redirigir a la lista de usuarios

        } catch (error) {
            await Swal.fire({ icon: 'error', title: 'Error en la Creación', text: error.message, background: '#1f2937', color: '#ffffff' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-12">
            <div className="w-full max-w-2xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Crear Nuevo Usuario</h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Rellena el formulario para añadir un nuevo usuario al sistema.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
                    <div className="flex items-center gap-4 my-8">
                        <div className={`flex-1 h-1 rounded-full transition-colors duration-500 ${activeTab === 'personal' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                        <div className={`flex-1 h-1 rounded-full transition-colors duration-500 ${activeTab === 'cuenta' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    </div>

                    <form onSubmit={handleSubmit} className="relative overflow-x-hidden">
                        <div className={`transition-transform duration-500 ease-in-out flex ${activeTab === 'cuenta' ? '-translate-x-full' : 'translate-x-0'}`}>
                            
                            {/* --- PASO 1: DATOS PERSONALES --- */}
                            <div className="w-full flex-shrink-0 px-1 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <FormInput id="nombres" name="nombres" value={formData.nombres} onChange={handleChange} placeholder="Nombres del usuario" icon={<User size={18}/>} label="Nombres" />
                                    <FormInput id="apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} placeholder="Apellidos del usuario" icon={<User size={18}/>} label="Apellidos" />
                                </div>
                                <FormInput id="fechaNacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleChange} icon={<Calendar size={18}/>} label="Fecha de Nacimiento" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <FormSelect id="sexo" name="sexo" value={formData.sexo} onChange={handleChange} icon={<Users size={18}/>} label="Sexo">
                                        <option value="" disabled>Selecciona...</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                                    </FormSelect>
                                    <FormSelect id="lugarResidencia" name="lugarResidencia" value={formData.lugarResidencia} onChange={handleChange} icon={<MapPin size={18}/>} label="Residencia">
                                        <option value="" disabled>Selecciona...</option>
                                        {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                                    </FormSelect>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button type="button" onClick={handleNextStep} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors transform hover:scale-105">
                                        <span>Siguiente</span> <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* --- PASO 2: DATOS DE LA CUENTA --- */}
                            <div className="w-full flex-shrink-0 px-1 space-y-6">
                                <FormInput id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="correo@ejemplo.com" icon={<Mail size={18}/>} label="Correo Electrónico" />
                                <FormInput id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" icon={<Lock size={18}/>} label="Contraseña" />
                                <FormInput id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Repite la contraseña" icon={<Lock size={18}/>} label="Confirmar Contraseña" />
                                <div className="pt-4 flex justify-between items-center">
                                    <button type="button" onClick={() => setActiveTab('personal')} className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                                        <ArrowLeft size={20} /> <span>Anterior</span>
                                    </button>
                                    <button type="submit" disabled={loading} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-wait transform hover:scale-105">
                                        {loading ? 'Creando...' : 'Crear Usuario'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="text-center mt-6">
                    <button onClick={() => router.push('/admin/users')} className="text-sm text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-2 mx-auto">
                        <X size={16} />
                        Cancelar y volver al listado
                    </button>
                </div>
            </div>
        </div>
    );
}
