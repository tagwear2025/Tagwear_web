// src/app/app/pages/LupaUsers/page.jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Search, User, Mail, MapPin, Loader, ShieldCheck, Info, Eye } from 'lucide-react';

// --- Componente para la tarjeta de usuario (Estilos completamente renovados) ---
const UserCard = ({ user }) => (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 transition-all duration-300 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10">
        <img
            className="w-24 h-24 rounded-full object-cover border-2 border-white/10 flex-shrink-0"
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.nombres}+${user.apellidos}&background=222&color=fff`}
            alt={`Foto de ${user.nombres}`}
        />
        <div className="flex-grow text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-bold text-white">
                    {user.nombres} {user.apellidos}
                </h3>
                {user.isSellerVerified && (
                    <span title="Vendedor Verificado" className="flex-shrink-0">
                        <ShieldCheck className="text-green-400" size={20} />
                    </span>
                )}
            </div>
            <p className="text-white/60 flex items-center justify-center sm:justify-start gap-2 mt-1 text-sm">
                <Mail size={14} /> {user.email}
            </p>
            {user.lugarResidencia && (
                <p className="text-white/50 flex items-center justify-center sm:justify-start gap-2 mt-1 text-sm">
                    <MapPin size={14} /> {user.lugarResidencia}
                </p>
            )}
        </div>
        <Link href={`/app/pages/LupaUsers/viewPerfilUsers/${user.id}`} passHref>
            <button className="mt-4 sm:mt-0 flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-full transition-transform transform hover:scale-105 shadow-lg shadow-orange-500/20">
                <Eye size={18} />
                <span>Ver Perfil</span>
            </button>
        </Link>
    </div>
);

// --- Componente principal de la página ---
export default function LupaUsersPage() {
    // --- LÓGICA DE ESTADOS Y BÚSQUEDA (INTACTA) ---
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
        <div className="min-h-screen bg-[#111] text-white p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">
                {/* --- SECCIÓN DE BÚSQUEDA REDISEÑADA --- */}
                <div className="bg-black/30 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-white/10 mb-10">
                    <h1 className="text-4xl font-bold text-center mb-2">Buscador de Vendedores</h1>
                    <p className="text-white/60 text-center mb-8">Encuentra vendedores verificados por su nombre o correo electrónico.</p>
                    
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Ej: Juan Perez o juan@ejemplo.com"
                                className="w-full pl-5 pr-5 py-3 bg-white/5 border-2 border-transparent rounded-full text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-all duration-300"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center gap-2 px-8 py-3 bg-orange-600 text-white font-semibold rounded-full hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-wait transform hover:scale-105"
                        >
                            {loading ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
                            <span>{loading ? 'Buscando...' : 'Buscar'}</span>
                        </button>
                    </form>
                </div>

                {/* --- SECCIÓN DE RESULTADOS --- */}
                <div className="mt-8">
                    {loading ? (
                        <div className="flex justify-center items-center p-10"><Loader className="animate-spin text-orange-500" size={48} /></div>
                    ) : searched ? (
                        results.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6">
                                {results.map(user => (
                                    <UserCard key={user.id} user={user} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 px-6 bg-black/30 rounded-2xl border border-white/10">
                                <Info size={48} className="mx-auto text-white/20 mb-4" />
                                <h3 className="text-xl font-semibold text-white">No se encontraron resultados</h3>
                                <p className="text-white/50 mt-2">Intenta con un término de búsqueda diferente.</p>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-16 px-6 bg-black/30 rounded-2xl border border-white/10">
                            <Search size={48} className="mx-auto text-white/20 mb-4" />
                            <h3 className="text-xl font-semibold text-white">Inicia una búsqueda</h3>
                            <p className="text-white/50 mt-2">Utiliza el formulario de arriba para encontrar vendedores.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
