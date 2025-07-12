'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { User, Calendar, Users, MapPin, Mail, Lock, ArrowRight, ArrowLeft, ShoppingCart, Tag, Package } from 'lucide-react';

// ✅ Componente de input mejorado con label
const FormInput = ({ id, name, type = 'text', value, onChange, placeholder, icon, required = true, label }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-white/80 mb-2">{label}</label>
        <div className="relative">
            {icon && <div className="absolute top-1/2 left-3 -translate-y-1/2 text-white/40 pointer-events-none">{icon}</div>}
            <input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                // ✅ Clase condicional para el campo de fecha
                className={`w-full pl-10 pr-4 py-3 bg-white/5 border-2 border-transparent rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-all duration-300 ${type === 'date' && !value ? 'text-white/40' : 'text-white'}`}
            />
        </div>
    </div>
);

// ✅ Componente de select mejorado con label
const FormSelect = ({ id, name, value, onChange, icon, children, required = true, label }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-white/80 mb-2">{label}</label>
        <div className="relative">
            {icon && <div className="absolute top-1/2 left-3 -translate-y-1/2 text-white/40 pointer-events-none">{icon}</div>}
            <select
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                // ✅ Clase condicional para el select
                className={`w-full pl-10 pr-4 py-3 bg-white/5 border-2 border-transparent rounded-lg focus:outline-none focus:border-orange-500 transition-all duration-300 appearance-none ${!value ? 'text-white/40' : 'text-white'}`}
            >
                {children}
            </select>
        </div>
    </div>
);


export default function RegisterPage() {
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
                background: '#1a202c', color: '#ffffff'
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
            await Swal.fire({ icon: 'error', title: 'Error', text: 'Las contraseñas no coinciden.', background: '#1a202c', color: '#ffffff' });
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            await Swal.fire({ icon: 'warning', title: 'Contraseña Débil', text: 'La contraseña debe tener al menos 6 caracteres.', background: '#1a202c', color: '#ffffff' });
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
                icon: 'success', title: '¡Registro Exitoso!',
                text: 'Tu cuenta ha sido creada. Serás redirigido al login.',
                timer: 2000, showConfirmButton: false, timerProgressBar: true,
                background: '#1a202c', color: '#ffffff'
            });
            router.push('/login');

        } catch (error) {
            await Swal.fire({ icon: 'error', title: 'Error en el Registro', text: error.message, background: '#1a202c', color: '#ffffff' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Lobster&display=swap');
                .font-lobster { font-family: 'Lobster', cursive; }
                body { background-color: #111; }
                
                /* ✅ Estilo para el icono del calendario en modo oscuro */
                input[type="date"]::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    cursor: pointer;
                }
            `}</style>

            {/* ✅ Contenedor principal corregido para mejor responsividad */}
            <div className="flex items-center justify-center min-h-screen w-full p-4 sm:p-6 md:p-8 bg-[#111]">
                <div className="grid grid-cols-1 lg:grid-cols-5 max-w-6xl w-full bg-black/50 backdrop-blur-lg rounded-2xl shadow-2xl shadow-orange-500/10 border border-white/10 overflow-hidden">
                    
                    {/* ✅ Panel Izquierdo Decorativo (ajustado a 2/5 del ancho) */}
                    <div className="hidden lg:col-span-2 lg:flex flex-col justify-center p-12 bg-orange-600/10 relative overflow-hidden">
                         <ShoppingCart size={128} className="absolute -right-10 -top-10 text-orange-500/10 rotate-12" />
                         <Tag size={96} className="absolute -left-12 bottom-20 text-orange-500/10 -rotate-12" />
                         <Package size={80} className="absolute right-10 bottom-5 text-orange-500/10 rotate-6" />
                        
                        <h2 className="font-lobster text-6xl text-white z-10">Tagwear</h2>
                        <p className="text-2xl text-white/80 mt-2 z-10">El mercado de la moda a tu alcance.</p>
                        <p className="text-white/60 mt-6 border-l-2 border-orange-500 pl-4 z-10">
                            Regístrate para descubrir, comprar y vender prendas únicas. Únete a nuestra comunidad y dale una segunda vida a la moda.
                        </p>
                    </div>

                    {/* ✅ Panel Derecho - Formulario (ajustado a 3/5 del ancho) */}
                    <div className="col-span-1 lg:col-span-3 p-8 sm:p-12 flex flex-col justify-center">
                        <div className="w-full max-w-md mx-auto">
                            <h1 className="text-3xl sm:text-4xl font-bold text-white text-center">Crea tu Cuenta</h1>
                            <p className="mt-2 text-white/60 text-center">Únete a la comunidad de Tagwear.</p>

                            <div className="flex items-center gap-4 my-8">
                                <div className={`flex-1 h-1 rounded-full transition-colors duration-500 ${activeTab === 'personal' ? 'bg-orange-500' : 'bg-white/10'}`}></div>
                                <div className={`flex-1 h-1 rounded-full transition-colors duration-500 ${activeTab === 'cuenta' ? 'bg-orange-500' : 'bg-white/10'}`}></div>
                            </div>

                            <form onSubmit={handleSubmit} className="relative overflow-x-hidden">
                                <div className={`transition-transform duration-500 ease-in-out flex ${activeTab === 'cuenta' ? '-translate-x-full' : 'translate-x-0'}`}>
                                    
                                    <div className="w-full flex-shrink-0 px-1 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormInput id="nombres" name="nombres" value={formData.nombres} onChange={handleChange} placeholder="Nombres" icon={<User size={18}/>} label="Nombres" />
                                            <FormInput id="apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} placeholder="Apellidos" icon={<User size={18}/>} label="Apellidos" />
                                        </div>
                                        <FormInput id="fechaNacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleChange} icon={<Calendar size={18}/>} label="Fecha de Nacimiento" />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        <div className="pt-2 flex justify-end">
                                            <button type="button" onClick={handleNextStep} className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-500 transition-colors transform hover:scale-105">
                                                <span>Siguiente</span> <ArrowRight size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full flex-shrink-0 px-1 space-y-4">
                                        <FormInput id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="tu-correo@ejemplo.com" icon={<Mail size={18}/>} label="Correo Electrónico" />
                                        <FormInput id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" icon={<Lock size={18}/>} label="Contraseña" />
                                        <FormInput id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Repite la contraseña" icon={<Lock size={18}/>} label="Confirmar Contraseña" />
                                        <div className="pt-2 flex justify-between">
                                            <button type="button" onClick={() => setActiveTab('personal')} className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white/70 font-bold rounded-lg hover:bg-white/20 transition-colors">
                                                <ArrowLeft size={20} /> <span>Anterior</span>
                                            </button>
                                            <button type="submit" disabled={loading} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-wait transform hover:scale-105">
                                                {loading ? 'Finalizando...' : 'Crear Cuenta'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                            
                            <div className="text-center pt-6 mt-6 border-t border-white/10">
                                <p className="text-sm text-white/50">
                                    ¿Ya tienes una cuenta?{' '}
                                    <Link href="/login" className="font-bold text-orange-500 hover:underline">
                                        Inicia sesión aquí
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
