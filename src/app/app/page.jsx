'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase'; // Usando tu importación original
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import ProductGrid from '@/app/components/marketplace/ProductGrid'; // Asegúrate que la ruta sea correcta
import { Loader, Star, ShoppingBag, Inbox, Search, X, SlidersHorizontal } from 'lucide-react';

export default function MarketplacePage() {
    // --- ESTADOS (LÓGICA INTACTA) ---
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [sortBy, setSortBy] = useState('default');
    const categoriasDisponibles = ['Todos', 'Poleras', 'Pantalones', 'Chaquetas', 'Zapatos', 'Accesorios'];

    // --- EFECTO DE CARGA DE DATOS (LÓGICA INTACTA) ---
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
                precio: Number(doc.data().precio) || 0
            }));
            setAllProducts(data);
            setLoading(false);
        }, (error) => {
            console.error("Error al obtener productos:", error.message);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [selectedCategory]);

    // --- LÓGICA DE PROCESAMIENTO DE PRODUCTOS (LÓGICA INTACTA) ---
    const processedProducts = useMemo(() => {
        let products = [...allProducts];
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            products = products.filter(product =>
                product.nombre.toLowerCase().includes(lowercasedTerm) ||
                product.precio.toString().includes(lowercasedTerm)
            );
        }
        switch (sortBy) {
            case 'price-desc':
                products.sort((a, b) => b.precio - a.precio);
                break;
            case 'price-asc':
                products.sort((a, b) => a.precio - b.precio);
                break;
            default:
                break;
        }
        return products;
    }, [allProducts, searchTerm, sortBy]);

    const { premiumProducts, regularProducts } = useMemo(() => {
        const premium = [];
        const regular = [];
        processedProducts.forEach(product => {
            if (product.isPremium) {
                premium.push(product);
            } else {
                regular.push(product);
            }
        });
        return { premiumProducts: premium, regularProducts: regular };
    }, [processedProducts]);

    // --- RENDERIZADO ---
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#111]">
                <Loader className="w-12 h-12 animate-spin text-orange-500" />
                <p className="mt-4 text-lg text-white/70">Cargando productos...</p>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Lobster&display=swap');
                .font-lobster { font-family: 'Lobster', cursive; }
                body { background-color: #111; }
            `}</style>

            <div className="bg-[#111] text-white min-h-screen">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    
                    {/* --- HERO SECTION Y BÚSQUEDA (MÁS COMPACTO) --- */}
                    {/* Se redujo drásticamente el padding (py-8), margen (mb-6) y tamaños de fuente */}
                    <header className="relative text-center py-2 px-6 rounded-2xl bg-black/20 border border-white/10 overflow-hidden mb-6">
                         <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent"></div>
                         <img src="/icons/bola8.png" alt="Decoración" className="absolute -top-10 -left-10 w-32 h-32 opacity-5" />
                         <img src="/icons/bola8.png" alt="Decoración" className="absolute -bottom-16 -right-10 w-32 h-32 opacity-5" />
                        
                        <div className="relative z-10">
                            <h1 className="font-lobster text-4xl md:text-5xl text-white">
                                Tagwear
                            </h1>
                            <p className="mt-1 text-base md:text-lg text-white/70">Tu mercado de moda en Bolivia</p>
                            
                            <div className="relative w-full max-w-xl mx-auto mt-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                <input
                                    type="text"
                                    placeholder="Encuentra tu estilo..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-10 py-2.5 bg-white/5 border-2 border-transparent rounded-full text-sm text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-all duration-300 shadow-lg"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-orange-500">
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </header>
                    
                    {/* --- FILTROS (SIN CAMBIOS) --- */}
                    <div className="flex flex-col md:flex-row gap-1 justify-between items-center mb-5 p-4 bg-black/30 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 text-white/80">
                            <SlidersHorizontal size={20} />
                            <span className="font-semibold">Filtros</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                             <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full md:w-auto px-4 py-2 bg-white/5 border border-white/10 rounded-lg appearance-none focus:outline-none focus:border-orange-500 cursor-pointer">
                                {categoriasDisponibles.map(cat => <option key={cat} value={cat} className="bg-[#222]">{cat}</option>)}
                            </select>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full md:w-auto px-4 py-2 bg-white/5 border border-white/10 rounded-lg appearance-none focus:outline-none focus:border-orange-500 cursor-pointer">
                                <option value="default" className="bg-[#222]">Ordenar por...</option>
                                <option value="price-desc" className="bg-[#222]">Precio: Mayor a menor</option>
                                <option value="price-asc" className="bg-[#222]">Precio: Menor a mayor</option>
                            </select>
                        </div>
                    </div>

                    {/* --- SECCIÓN DE RESULTADOS (SIN CAMBIOS) --- */}
                    {processedProducts.length === 0 && !loading ? (
                        <div className="text-center text-white/50 py-20">
                            <Inbox size={64} className="mx-auto mb-4 text-white/20"/>
                            <p className="text-2xl font-semibold">No se encontraron productos</p>
                            <p className="mt-2">Intenta cambiar los filtros o el término de búsqueda.</p>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {premiumProducts.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 flex items-center justify-center bg-orange-500/20 rounded-full">
                                            <Star className="text-orange-400" size={24} />
                                        </div>
                                        <h2 className="text-3xl font-bold text-white">Destacados</h2>
                                    </div>
                                    <ProductGrid products={premiumProducts} />
                                </section>
                            )}
                            {regularProducts.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 flex items-center justify-center bg-orange-500/20 rounded-full">
                                            <ShoppingBag className="text-orange-400" size={24} />
                                        </div>
                                        <h2 className="text-3xl font-bold text-white">
                                            {selectedCategory === 'Todos' ? 'Explora lo Nuevo' : `Resultados para "${selectedCategory}"`}
                                        </h2>
                                    </div>
                                    <ProductGrid products={regularProducts} />
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
