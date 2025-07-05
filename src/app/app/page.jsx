// src/app/app/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import ProductGrid from '@/app/components/marketplace/ProductGrid';

export default function MarketplacePage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      // Escuchamos en tiempo real los cambios en la colección 'products'
      const q = query(collection(db, 'products'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const productsData = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() });
        });
        setProducts(productsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching products: ", error);
        setLoading(false);
      });

      // Limpiamos el listener cuando el componente se desmonta
      return () => unsubscribe();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="text-center p-10">
        <p className="animate-pulse">Cargando pines...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Explora</h1>
      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="text-center text-gray-500">
          <p>¡Aún no hay nada por aquí!</p>
          <p>Sé el primero en crear un Pin.</p>
        </div>
      )}
    </div>
  );
}
