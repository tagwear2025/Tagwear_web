'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import Swal from 'sweetalert2';
import { Mail, Lock, Eye, EyeOff, ShoppingBag, ShieldCheck, MapPin, ChevronDown } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Autenticar al usuario con Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // 2. Obtener el token de ID del usuario
            const idToken = await user.getIdToken(true);

            // 3. ✅ CORRECCIÓN: Se restaura el body en el fetch para que coincida con lo que espera tu API.
            // Esta es la versión original que sí funcionará con tu backend.
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ token: idToken }),
            });

            const data = await response.json();

            // Si la respuesta del servidor no es OK (ej. 500), el error será capturado por el catch.
            if (!response.ok) {
                throw new Error(data.error || 'Error en el servidor durante el login');
            }

            // 4. Notificar al usuario y redirigir
            await Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: 'Has iniciado sesión correctamente.',
                timer: 1200,
                showConfirmButton: false,
                background: '#1a202c',
                color: '#ffffff'
            });

            router.replace(data.role === 'admin' ? '/admin' : '/app');

        } catch (err) {
            // 5. Manejar errores de Firebase o de nuestro propio servidor
            let errorMessage = 'Ocurrió un error inesperado.';
            
            if (err.code) { // Errores específicos de Firebase
                switch (err.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                        errorMessage = 'Correo o contraseña incorrectos.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'El formato del correo es inválido.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Acceso bloqueado temporalmente. Intenta más tarde.';
                        break;
                    default:
                        console.error("Error de Firebase no manejado:", err);
                        errorMessage = 'Error de autenticación. Por favor, intenta de nuevo.';
                }
            } else { // Errores de nuestro fetch o servidor
                errorMessage = err.message;
            }

            await Swal.fire({
                title: 'Error de Inicio de Sesión',
                text: errorMessage,
                icon: 'error',
                background: '#1a202c',
                color: '#ffffff'
            });
        } finally {
            setLoading(false);
        }
    };

    const goToRegister = () => {
        router.push('/register');
    };

    // El resto de tu JSX permanece exactamente igual.
    return (
        <>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Lobster&display=swap');
                
                .font-lobster {
                    font-family: 'Lobster', cursive;
                }

                body {
                    background-color: #111;
                }

                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(10deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in-form {
                    animation: fadeIn 0.8s ease-out forwards;
                }
                
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-10px);
                    }
                    60% {
                        transform: translateY(-5px);
                    }
                }
                .animate-bounce-slow {
                    animation: bounce 2s infinite;
                }
            `}</style>
            
            <div className="relative w-full bg-[#111]">
                {/* Sección del Login */}
                <div className="relative flex items-center justify-center min-h-screen w-full p-4 overflow-hidden">
                    <div className="fixed -top-20 -left-20 w-72 h-72 z-0">
                        <img src="/icons/bola8.png" alt="Bola 8" className="w-full h-full opacity-10 animate-float" />
                    </div>
                    <div className="fixed -bottom-20 -right-20 w-72 h-72 z-0">
                        <img src="/icons/bola8.png" alt="Bola 8" className="w-full h-full opacity-10 animate-float [animation-delay:-3s]" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        <form
                            onSubmit={handleSubmit}
                            className="fade-in-form bg-black/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl shadow-orange-500/10 w-full max-w-md space-y-6 border border-white/10"
                        >
                            <div className="flex flex-col items-center justify-center mb-6 text-center">
                                <img src="/icons/bola8.png" alt="Logo Bola 8" className="w-16 h-16 mb-4" />
                                <h1 className="font-lobster text-5xl font-bold text-white tracking-wider">
                                    Tagwear
                                </h1>
                                <p className="text-white/60 mt-2">Inicia sesión para continuar</p>
                            </div>

                            <div className="relative">
                                <Mail className="absolute top-1/2 left-3 -translate-y-1/2 text-white/40" size={20} />
                                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Correo electrónico" className="w-full pl-10 pr-4 py-3 bg-white/5 border-2 border-transparent rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-all duration-300" />
                            </div>

                            <div className="relative">
                                <Lock className="absolute top-1/2 left-3 -translate-y-1/2 text-white/40" size={20} />
                                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Contraseña" className="w-full pl-10 pr-10 py-3 bg-white/5 border-2 border-transparent rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-all duration-300" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 hover:text-orange-500 transition-colors">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-orange-500/20 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105">
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Ingresando...
                                    </div>
                                ) : 'Ingresar'}
                            </button>

                            <div className="text-center">
                                <p className="text-sm text-white/50">
                                    ¿No tienes cuenta?{' '}
                                    <button type="button" onClick={goToRegister} className="font-bold text-orange-500 hover:underline">
                                        Regístrate
                                    </button>
                                </p>
                            </div>
                        </form>
                        
                        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/50 opacity-0 md:opacity-100">
                            <span className="text-xs">Descubre más</span>
                            <ChevronDown className="animate-bounce-slow" size={24} />
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-5xl mx-auto px-4 py-20 text-white">
                    <div className="text-center mb-16">
                        <h2 className="font-lobster text-6xl text-white">¿Qué es Tagwear?</h2>
                        <p className="text-xl text-white/70 mt-2">Tu mercado de moda en Bolivia</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        <div className="flex flex-col items-center p-6 bg-white/5 rounded-xl border border-white/10">
                            <div className="p-4 bg-orange-500/20 rounded-full mb-4">
                                <ShoppingBag size={32} className="text-orange-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Compra y Vende</h3>
                            <p className="text-white/60">
                                Explora un universo de ropa y accesorios. Publica tus artículos y conecta con compradores y vendedores de todo el país.
                            </p>
                        </div>
                        
                        <div className="flex flex-col items-center p-6 bg-white/5 rounded-xl border border-white/10">
                            <div className="p-4 bg-orange-500/20 rounded-full mb-4">
                                <ShieldCheck size={32} className="text-orange-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Seguridad Garantizada</h3>
                            <p className="text-white/60">
                                Interactúa con vendedores verificados. Nuestro sistema de perfiles y calificaciones te ayuda a realizar transacciones con total confianza.
                            </p>
                        </div>
                        
                        <div className="flex flex-col items-center p-6 bg-white/5 rounded-xl border border-white/10">
                            <div className="p-4 bg-orange-500/20 rounded-full mb-4">
                                <MapPin size={32} className="text-orange-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Hecho para Bolivia</h3>
                            <p className="text-white/60">
                                Una plataforma diseñada por y para el mercado boliviano, facilitando el comercio de moda de segunda mano a nivel nacional.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
