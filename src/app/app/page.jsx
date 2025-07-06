// src/app/app/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import ProductGrid from '@/app/components/marketplace/ProductGrid';
import { Loader, Star, ShoppingBag, Inbox } from 'lucide-react';

export default function MarketplacePage() {
  const [premiumProducts, setPremiumProducts] = useState([]);
  const [regularProducts, setRegularProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // 1. Consulta para productos Premium y DISPONIBLES
    const premiumQuery = query(
      collection(db, 'products'),
      where('isPremium', '==', true),
      where('estado', '==', 'disponible') // <-- AÑADIDO: Filtro de disponibilidad
      // orderBy('fechaCreacion', 'desc') // Puedes reactivar esto si creaste el índice
    );
    const unsubscribePremium = onSnapshot(premiumQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPremiumProducts(data);
    });

    // 2. Consulta para productos Regulares y DISPONIBLES
    const regularQuery = query(
      collection(db, 'products'),
      where('isPremium', '==', false),
      where('estado', '==', 'disponible') // <-- AÑADIDO: Filtro de disponibilidad
      // orderBy('fechaCreacion', 'desc') // Puedes reactivar esto si creaste el índice
    );
    const unsubscribeRegular = onSnapshot(regularQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegularProducts(data);
      setLoading(false); 
    }, (error) => {
      console.error("Error fetching regular products:", error.message);
      setLoading(false);
    });

    return () => {
      unsubscribePremium();
      unsubscribeRegular();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader className="w-12 h-12 animate-spin text-blue-500" />
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {premiumProducts.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Star className="text-yellow-400" size={32} />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Destacados</h2>
          </div>
          <ProductGrid products={premiumProducts} />
        </section>
      )}

      <section>
         <div className="flex items-center gap-3 mb-6">
            <ShoppingBag className="text-blue-500" size={32} />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Explora lo Nuevo</h2>
          </div>
        {regularProducts.length > 0 || premiumProducts.length > 0 ? (
          <ProductGrid products={regularProducts} />
        ) : (
          <div className="text-center text-gray-500 py-10">
            <Inbox size={48} className="mx-auto mb-4"/>
            <p className="text-xl font-semibold">¡Aún no hay productos disponibles!</p>
            <p>Vuelve más tarde o sé el primero en publicar algo increíble.</p>
          </div>
        )}
      </section>
    </div>
  );
}
