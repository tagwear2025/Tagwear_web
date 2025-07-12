'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Swal from 'sweetalert2';
import { fetcher } from '@/lib/fetcher';
import { User, Calendar, Users, MapPin, Lock, Save, X, Loader } from 'lucide-react';

// --- Componente de Input reutilizable y estilizado ---
const FormField = ({ id, name, type = 'text', value, onChange, label, icon, required = true, placeholder }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
        <div className="relative">
            {icon && <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</div>}
            <input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
        </div>
    </div>
);

// --- Componente de Select reutilizable y estilizado ---
const FormSelect = ({ id, name, value, onChange, label, icon, children }) => (
     <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
        <div className="relative">
             {icon && <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</div>}
            <select
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
                {children}
            </select>
        </div>
    </div>
);


export default function EditUserPage() {
    const router = useRouter();
    const { userId } = useParams();

    const { data: userData, error, isLoading } = useSWR(userId ? `/api/users/${userId}` : null, fetcher);

    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        fechaNacimiento: '',
        sexo: '',
        lugarResidencia: '',
    });
    const [password, setPassword] = useState(''); // Estado separado para la contraseña
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (userData) {
            setFormData({
                nombres: userData.nombres || '',
                apellidos: userData.apellidos || '',
                // Asegura que la fecha tenga el formato correcto YYYY-MM-DD
                fechaNacimiento: userData.fechaNacimiento ? new Date(userData.fechaNacimiento).toISOString().split('T')[0] : '',
                sexo: userData.sexo || '',
                lugarResidencia: userData.lugarResidencia || '',
            });
        }
    }, [userData]);

    const departamentos = ['Beni', 'Cochabamba', 'Chuquisaca', 'La Paz', 'Oruro', 'Pando', 'Potosí', 'Santa Cruz', 'Tarija'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Validación de contraseña (si se ha escrito algo)
        if (password && password.length < 6) {
            Swal.fire('Contraseña Débil', 'La nueva contraseña debe tener al menos 6 caracteres.', 'warning');
            return;
        }
        
        setIsSubmitting(true);

        // Construir el payload dinámicamente
        const payload = {
            userId,
            ...formData,
        };
        if (password) {
            payload.password = password; // Solo añadir la contraseña si no está vacía
        }

        try {
            const response = await fetch('/api/users/update-admin', { // Usar el nuevo endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'No se pudo actualizar el usuario.');
            }
            
            await Swal.fire('¡Actualizado!', 'Los datos del usuario han sido actualizados.', 'success');
            router.push('/admin/users');

        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen bg-gray-900"><Loader className="animate-spin text-blue-500" size={48} /></div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: No se pudo cargar al usuario.</div>;
    if (!userData) return <div className="p-8 text-center">Usuario no encontrado.</div>;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-12">
            <div className="w-full max-w-3xl bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Editar Usuario</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{userData.email}</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* --- Sección de Datos Personales --- */}
                    <fieldset className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                        <legend className="text-lg font-semibold text-gray-800 dark:text-white">Datos Personales</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField id="nombres" name="nombres" value={formData.nombres} onChange={handleChange} label="Nombres" icon={<User size={18}/>} />
                            <FormField id="apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} label="Apellidos" icon={<User size={18}/>} />
                            <FormField id="fechaNacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleChange} label="Fecha de Nacimiento" icon={<Calendar size={18}/>} />
                            <FormSelect id="sexo" name="sexo" value={formData.sexo} onChange={handleChange} label="Sexo" icon={<Users size={18}/>}>
                                <option value="" disabled>Selecciona...</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                                <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                            </FormSelect>
                            <div className="md:col-span-2">
                                <FormSelect id="lugarResidencia" name="lugarResidencia" value={formData.lugarResidencia} onChange={handleChange} label="Lugar de Residencia" icon={<MapPin size={18}/>}>
                                    <option value="" disabled>Selecciona...</option>
                                    {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                                </FormSelect>
                            </div>
                        </div>
                    </fieldset>

                    {/* --- Sección de Credenciales --- */}
                    <fieldset className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                        <legend className="text-lg font-semibold text-gray-800 dark:text-white">Credenciales de Acceso</legend>
                        <FormField 
                            id="password" 
                            name="password" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            label="Nueva Contraseña"
                            icon={<Lock size={18}/>} 
                            placeholder="Dejar en blanco para no cambiar"
                            required={false} // No es requerido
                        />
                    </fieldset>

                    {/* --- Botones de Acción --- */}
                    <div className="pt-6 flex flex-col sm:flex-row gap-4">
                        <button type="button" onClick={() => router.push('/admin/users')} className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-lg transition">
                            <X size={18} /> Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50">
                            {isSubmitting ? <Loader className="animate-spin" size={20}/> : <Save size={18} />}
                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
