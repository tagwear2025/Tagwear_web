// src/app/app/pages/Profile_Ventas/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { ShieldCheck, Loader, Frown, PlusCircle } from 'lucide-react';
import MyProductsList from '@/app/components/productos/MyProductsList'; // <-- 1. IMPORTAR
import { Toaster } from 'react-hot-toast'; // Para notificaciones

// Componente que se muestra si el usuario NO está verificado
const BecomeSellerPrompt = () => (
  <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-2xl mx-auto">
    <ShieldCheck className="w-20 h-20 text-blue-500 mb-6" />
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">¡Desbloquea tu potencial de venta!</h1>
    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
      Para garantizar la seguridad y confianza en nuestra comunidad, necesitamos verificar tu identidad. Es un proceso rápido y único.
    </p>
    <Link href="/app/pages/Profile_Ventas/PerfilCreate" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105">
      Convertirme en Vendedor
    </Link>
  </div>
);

// Componente que se muestra si el usuario SÍ está verificado
const SellerMarketplace = ({ user }) => ( // <-- 2. RECIBIR EL USUARIO
  <div>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Tu Tienda</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona tus artículos y ventas desde aquí.</p>
        </div>
        <Link 
            href="/app/productos/nuevo" 
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md w-full sm:w-auto justify-center"
        >
            <PlusCircle size={20} />
            <span>Vender un Artículo</span>
        </Link>
    </div>
    
    {/* 3. RENDERIZAR LA LISTA DE PRODUCTOS */}
    <div className="p-1 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-inner">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Mis Productos</h2>
      <MyProductsList user={user} />
    </div>
  </div>
);


export default function ProfileVentasPage() {
  const { user, loading: authLoading } = useAuth();
  const [isVerified, setIsVerified] = useState(null); // null: cargando, false: no verificado, true: verificado
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const checkVerificationStatus = async () => {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setIsVerified(docSnap.data().isSellerVerified === true);
        } else {
          throw new Error("No se encontró el documento del usuario.");
        }
      } catch (err) {
        console.error("Error fetching user verification status:", err);
        setError(err.message);
        setIsVerified(false); // Asumir no verificado en caso de error
      }
    };

    checkVerificationStatus();
  }, [user, authLoading]);

  // Estado de Carga
  if (isVerified === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader className="w-12 h-12 animate-spin text-blue-500" />
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Verificando tu estado...</p>
      </div>
    );
  }

  // Estado de Error
  if (error) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
         <Frown className="w-12 h-12 text-red-500" />
         <p className="mt-4 text-lg text-red-500">Ocurrió un error al cargar tus datos.</p>
         <p className="text-sm text-gray-500">{error}</p>
       </div>
    );
  }

  // Renderizado Condicional
  return (
    <div className="container mx-auto p-4 sm:p-8">
      <Toaster position="bottom-right" />
      {isVerified ? <SellerMarketplace user={user} /> : <BecomeSellerPrompt />}
    </div>
  );
}
