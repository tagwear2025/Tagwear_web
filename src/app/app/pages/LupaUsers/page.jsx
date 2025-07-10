// 1. Reemplaza el contenido de src/app/app/pages/LupaUsers/page.jsx con este código.
'use client';

import { useState } from 'react';
import Link from 'next/link'; // Importar Link para la navegación
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Search, User, Mail, MapPin, Loader, ShieldCheck, Info, Eye } from 'lucide-react'; // Importar Eye

// --- Componente para la tarjeta de usuario (actualizado con botón) ---
const UserCard = ({ user }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-xl">
        <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <img
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.nombres}+${user.apellidos}&background=random`}
                    alt={`Foto de ${user.nombres}`}
                />
                <div className="flex-grow">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {user.nombres} {user.apellidos}
                        </h3>
                        {user.isSellerVerified && <ShieldCheck className="text-green-500" size={20} />}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                        <Mail size={14} /> {user.email}
                    </p>
                    {user.lugarResidencia && (
                        <p className="text-gray-500 dark:text-gray-300 flex items-center gap-2 mt-1">
                            <MapPin size={14} /> {user.lugarResidencia}
                        </p>
                    )}
                </div>
                {/* ✅ BOTÓN PARA VER EL PERFIL */}
                <Link href={`/app/pages/LupaUsers/viewPerfilUsers/${user.id}`} passHref>
                    <button className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-semibold rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors w-full sm:w-auto justify-center">
                        <Eye size={18} />
                        <span>Ver Perfil</span>
                    </button>
                </Link>
            </div>
        </div>
    </div>
);


// --- Componente principal de la página ---
export default function LupaUsersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setResults([]);
            setSearched(false);
            return;
        }
        setLoading(true);
        setSearched(true);
        setResults([]);
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("isSellerVerified", "==", true));
            const querySnapshot = await getDocs(q);
            const allVerifiedUsers = [];
            querySnapshot.forEach((doc) => {
                allVerifiedUsers.push({ id: doc.id, ...doc.data() });
            });
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            const filteredResults = allVerifiedUsers.filter(user => {
                const fullName = `${user.nombres || ''} ${user.apellidos || ''}`.toLowerCase();
                const email = (user.email || '').toLowerCase();
                return fullName.includes(lowerCaseSearchTerm) || email.includes(lowerCaseSearchTerm);
            });
            setResults(filteredResults);
        } catch (error) {
            console.error("Error al buscar usuarios:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Buscador de Vendedores</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Encuentra vendedores verificados por su nombre, apellido o correo electrónico.</p>
                    
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Ej: Juan Perez o juan@ejemplo.com"
                                className="w-full pl-5 pr-12 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                            />
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-wait"
                        >
                            {loading ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
                            <span>{loading ? 'Buscando...' : 'Buscar'}</span>
                        </button>
                    </form>
                </div>

                <div className="mt-8">
                    {loading ? (
                        <div className="flex justify-center items-center p-10"><Loader className="animate-spin text-blue-500" size={48} /></div>
                    ) : searched ? (
                        results.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6">
                                {results.map(user => (
                                    <UserCard key={user.id} user={user} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                                <Info size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">No se encontraron resultados</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">Intenta con un término de búsqueda diferente.</p>
                            </div>
                        )
                    ) : (
                         <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                            <Search size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Inicia una búsqueda</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Utiliza el formulario de arriba para encontrar vendedores.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
