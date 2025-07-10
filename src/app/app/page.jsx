// src/app/app/page.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import ProductGrid from '@/app/components/marketplace/ProductGrid';
import { Loader, Star, ShoppingBag, Inbox, Search, X, ChevronsUpDown } from 'lucide-react';

export default function MarketplacePage() {
  // --- ESTADOS ---
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para la búsqueda y los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  
  // Estado para la ordenación
  const [sortBy, setSortBy] = useState('default'); // Opciones: 'default', 'price-desc', 'price-asc'

  const categoriasDisponibles = ['Todos', 'Poleras', 'Pantalones', 'Chaquetas', 'Zapatos', 'Accesorios'];

  // --- EFECTO DE CARGA DE DATOS ---
  // Se ejecuta cuando la categoría seleccionada cambia.
  useEffect(() => {
    setLoading(true);

    let productsQuery = query(
      collection(db, 'products'),
      where('estado', '==', 'disponible')
    );

    if (selectedCategory !== 'Todos') {
      productsQuery = query(productsQuery, where('categoria', '==', selectedCategory));
    }

    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          // Aseguramos que el precio sea un número para ordenar correctamente
          precio: Number(doc.data().precio) || 0
      }));
      setAllProducts(data);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener productos. Es posible que necesites un índice en Firestore si combinas filtros complejos.", error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCategory]);

  // --- LÓGICA DE FILTRADO, BÚSQUEDA Y ORDENACIÓN EN EL CLIENTE ---
  // `useMemo` recalcula los productos solo si cambian las dependencias.
  const processedProducts = useMemo(() => {
    let products = [...allProducts];

    // 1. Filtrado por término de búsqueda
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      products = products.filter(product =>
        product.nombre.toLowerCase().includes(lowercasedTerm) ||
        product.precio.toString().includes(lowercasedTerm)
      );
    }
    
    // 2. Ordenación
    switch (sortBy) {
      case 'price-desc':
        products.sort((a, b) => b.precio - a.precio);
        break;
      case 'price-asc':
        products.sort((a, b) => a.precio - b.precio);
        break;
      // case 'default': (No se necesita hacer nada, mantiene el orden de Firestore)
      default:
        break;
    }

    return products;
  }, [allProducts, searchTerm, sortBy]);

  // --- CORRECCIÓN DEL ERROR ---
  // `useMemo` para separar los productos en premium y regulares.
  // El error estaba aquí. Usamos variables internas (premium, regular) y las retornamos
  // en un objeto cuyas claves coinciden con las que queremos desestructurar.
  const { premiumProducts, regularProducts } = useMemo(() => {
    const premium = []; // Variable interna
    const regular = []; // Variable interna
    
    processedProducts.forEach(product => {
      if (product.isPremium) {
        premium.push(product);
      } else {
        regular.push(product);
      }
    });

    // Se retorna un objeto con las claves correctas
    return { premiumProducts: premium, regularProducts: regular };
  }, [processedProducts]);


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
      
      <section className="mb-12">
        {/* --- BARRA DE BÚSQUEDA --- */}
        <div className="relative w-full max-w-2xl mx-auto mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o precio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-10 py-3 text-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm focus:shadow-md"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={20} />
            </button>
          )}
        </div>

        {/* --- CONTENEDOR DE FILTROS COMPACTOS --- */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
            {/* Filtro de Categoría */}
            <div className="relative w-full sm:w-1/2">
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {categoriasDisponibles.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20}/>
            </div>

            {/* Filtro de Ordenación */}
            <div className="relative w-full sm:w-1/2">
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="default">Ordenar por...</option>
                    <option value="price-desc">Precio: Mayor a menor</option>
                    <option value="price-asc">Precio: Menor a mayor</option>
                </select>
                 <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20}/>
            </div>
        </div>
      </section>

      {/* --- SECCIÓN DE RESULTADOS --- */}
      {processedProducts.length === 0 && !loading ? (
        <div className="text-center text-gray-500 py-10">
          <Inbox size={48} className="mx-auto mb-4"/>
          <p className="text-xl font-semibold">No se encontraron productos</p>
          <p>Intenta cambiar los filtros o el término de búsqueda.</p>
        </div>
      ) : (
        <>
          {premiumProducts.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <Star className="text-yellow-400" size={32} />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Destacados</h2>
              </div>
              <ProductGrid products={premiumProducts} />
            </section>
          )}

          {regularProducts.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <ShoppingBag className="text-blue-500" size={32} />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {selectedCategory === 'Todos' ? 'Explora lo Nuevo' : `Resultados para "${selectedCategory}"`}
                </h2>
              </div>
              <ProductGrid products={regularProducts} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
