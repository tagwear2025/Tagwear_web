'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import ProductGrid from '@/app/components/marketplace/ProductGrid';
import { Loader, Star, ShoppingBag, Inbox, Search, X, SlidersHorizontal, Filter, ChevronDown, ChevronUp } from 'lucide-react';

// Importar datos de productos para los filtros
import {
    categories,
    clothingBrands,
    electronicBrands,
    genders,
    conditions
} from '@/data/productData';

export default function MarketplacePage() {
    // --- ESTADOS PRINCIPALES ---
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    
    // --- NUEVO ESTADO PARA MOSTRAR MÁS/MENOS PRODUCTOS DESTACADOS ---
    const [showAllPremium, setShowAllPremium] = useState(false);
    const PREMIUM_INITIAL_COUNT = 8; // Número inicial de productos destacados a mostrar

    // --- ESTADOS DE FILTROS ---
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [selectedSubcategory, setSelectedSubcategory] = useState('Todos');
    const [selectedBrand, setSelectedBrand] = useState('Todos');
    const [selectedGender, setSelectedGender] = useState('Todos');
    const [selectedCondition, setSelectedCondition] = useState('Todos');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState('newest');

    // --- DATOS DERIVADOS PARA FILTROS ---
    const availableSubcategories = useMemo(() => {
        if (selectedCategory === 'Todos') return [];
        return categories[selectedCategory] || [];
    }, [selectedCategory]);

    const availableBrands = useMemo(() => {
        const isElectronic = selectedCategory === 'Electrónicos 🔌';
        return isElectronic ? electronicBrands : clothingBrands;
    }, [selectedCategory]);

    // --- EFECTO DE CARGA DE DATOS (OPTIMIZADO SIN ÍNDICES) ---
    useEffect(() => {
        setLoading(true);
        
        // Query simple que no requiere índices compuestos
        const productsQuery = query(
            collection(db, 'products'),
            where('estado', '==', 'disponible')
        );

        const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                return {
                    id: doc.id,
                    ...docData,
                    precio: Number(docData.precio) || 0,
                    precioOferta: docData.precioOferta ? Number(docData.precioOferta) : null,
                    // Manejar fechaCreacion que puede ser Timestamp o Date
                    fechaCreacion: docData.fechaCreacion?.toDate ? docData.fechaCreacion.toDate() : 
                                  (docData.fechaCreacion instanceof Date ? docData.fechaCreacion : new Date()),
                    // Asegurar que los campos críticos existan
                    categoriaPrincipal: docData.categoriaPrincipal || '',
                    subcategoria: docData.subcategoria || '',
                    marca: docData.marca || '',
                    genero: docData.genero || '',
                    condicion: docData.condicion || '',
                    isPremium: docData.isPremium || false
                };
            });
            setAllProducts(data);
            setLoading(false);
        }, (error) => {
            console.error("Error al obtener productos:", error.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []); // Sin dependencias para evitar re-consultas innecesarias

    // --- LÓGICA DE PROCESAMIENTO DE PRODUCTOS ---
    const processedProducts = useMemo(() => {
        let products = [...allProducts];

        // Filtro por búsqueda
        if (searchTerm.trim()) {
            const lowercasedTerm = searchTerm.toLowerCase().trim();
            products = products.filter(product => {
                const searchableFields = [
                    product.nombre || '',
                    product.descripcion || '',
                    product.marca || '',
                    product.categoriaPrincipal || '',
                    product.subcategoria || '',
                    product.genero || '',
                    product.condicion || '',
                    product.vendedorNombre || ''
                ].join(' ').toLowerCase();
                
                return searchableFields.includes(lowercasedTerm) ||
                       product.precio.toString().includes(lowercasedTerm);
            });
        }

        // Filtro por categoría principal
        if (selectedCategory !== 'Todos') {
            products = products.filter(product => 
                product.categoriaPrincipal === selectedCategory
            );
        }

        // Filtro por subcategoría
        if (selectedSubcategory !== 'Todos') {
            products = products.filter(product => 
                product.subcategoria === selectedSubcategory
            );
        }

        // Filtro por marca
        if (selectedBrand !== 'Todos') {
            products = products.filter(product => 
                product.marca === selectedBrand
            );
        }

        // Filtro por género
        if (selectedGender !== 'Todos') {
            products = products.filter(product => 
                product.genero === selectedGender
            );
        }

        // Filtro por condición
        if (selectedCondition !== 'Todos') {
            products = products.filter(product => 
                product.condicion === selectedCondition
            );
        }

        // Filtro por precio
        if (priceRange.min || priceRange.max) {
            products = products.filter(product => {
                const price = product.precioOferta || product.precio;
                const min = priceRange.min ? parseFloat(priceRange.min) : 0;
                const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
                return price >= min && price <= max;
            });
        }

        // Ordenamiento en el cliente (no requiere índices)
        switch (sortBy) {
            case 'price-desc':
                products.sort((a, b) => {
                    const priceA = a.precioOferta || a.precio;
                    const priceB = b.precioOferta || b.precio;
                    return priceB - priceA;
                });
                break;
            case 'price-asc':
                products.sort((a, b) => {
                    const priceA = a.precioOferta || a.precio;
                    const priceB = b.precioOferta || b.precio;
                    return priceA - priceB;
                });
                break;
            case 'name-asc':
                products.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
                break;
            case 'oldest':
                products.sort((a, b) => a.fechaCreacion - b.fechaCreacion);
                break;
            case 'newest':
            default:
                products.sort((a, b) => b.fechaCreacion - a.fechaCreacion);
                break;
        }

        return products;
    }, [allProducts, searchTerm, selectedCategory, selectedSubcategory, selectedBrand, selectedGender, selectedCondition, priceRange, sortBy]);

    // Separar productos premium y regulares
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

    // --- PRODUCTOS PREMIUM CON LÓGICA DE MOSTRAR MÁS/MENOS ---
    const displayedPremiumProducts = useMemo(() => {
        if (showAllPremium || premiumProducts.length <= PREMIUM_INITIAL_COUNT) {
            return premiumProducts;
        }
        return premiumProducts.slice(0, PREMIUM_INITIAL_COUNT);
    }, [premiumProducts, showAllPremium]);

    // --- FUNCIONES DE UTILIDAD ---
    const clearAllFilters = () => {
        setSelectedCategory('Todos');
        setSelectedSubcategory('Todos');
        setSelectedBrand('Todos');
        setSelectedGender('Todos');
        setSelectedCondition('Todos');
        setPriceRange({ min: '', max: '' });
        setSearchTerm('');
        setSortBy('newest');
        setShowFilters(false); // Cerrar filtros al limpiar
    };

    const hasActiveFilters = useMemo(() => {
        return selectedCategory !== 'Todos' || 
               selectedSubcategory !== 'Todos' || 
               selectedBrand !== 'Todos' || 
               selectedGender !== 'Todos' || 
               selectedCondition !== 'Todos' || 
               priceRange.min || 
               priceRange.max || 
               searchTerm.trim();
    }, [selectedCategory, selectedSubcategory, selectedBrand, selectedGender, selectedCondition, priceRange, searchTerm]);

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
                
                /* Estilos para mejorar la responsividad en móviles */
                @media (max-width: 640px) {
                    .mobile-filter-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }
                    
                    .mobile-price-inputs {
                        flex-direction: column;
                        gap: 0.5rem;
                    }
                    
                    .mobile-filter-panel {
                        border-radius: 0.75rem;
                        padding: 1rem;
                        margin: 0 -0.5rem;
                    }
                }
                
                /* Animaciones suaves para el panel de filtros */
                .filter-panel-transition {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                /* Estilos mejorados para el botón de mostrar más/menos */
                .show-more-button {
                    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                    box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
                    transition: all 0.3s ease;
                }
                
                .show-more-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
                }
            `}</style>

            <div className="bg-[#111] text-white min-h-screen">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    
                    {/* --- HERO SECTION Y BÚSQUEDA --- */}
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
                                    placeholder="Busca por nombre, marca, categoría..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-10 py-2.5 bg-white/5 border-2 border-transparent rounded-full text-sm text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-all duration-300 shadow-lg"
                                />
                                {searchTerm && (
                                    <button 
                                        onClick={() => setSearchTerm('')} 
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-orange-500 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </header>
                    
                    {/* --- FILTROS MEJORADOS Y COMPLETAMENTE RESPONSIVOS --- */}
                    <div className="mb-6">
                        {/* Barra de filtros compacta - Mejorada para móviles */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center p-3 sm:p-4 bg-black/30 rounded-xl border border-white/10">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                <div className="flex items-center gap-2 text-white/80">
                                    <SlidersHorizontal size={20} />
                                    <span className="font-semibold">Filtros</span>
                                    {hasActiveFilters && (
                                        <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                                            {[selectedCategory !== 'Todos' ? 1 : 0,
                                              selectedSubcategory !== 'Todos' ? 1 : 0,
                                              selectedBrand !== 'Todos' ? 1 : 0,
                                              selectedGender !== 'Todos' ? 1 : 0,
                                              selectedCondition !== 'Todos' ? 1 : 0,
                                              priceRange.min || priceRange.max ? 1 : 0,
                                              searchTerm.trim() ? 1 : 0].reduce((a, b) => a + b, 0)} activos
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button 
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                                    >
                                        <Filter size={16} />
                                        <span className="text-sm">{showFilters ? 'Ocultar' : 'Mostrar'}</span>
                                        <ChevronDown className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} size={16} />
                                    </button>
                                    
                                    {hasActiveFilters && (
                                        <button 
                                            onClick={clearAllFilters}
                                            className="text-sm text-orange-400 hover:text-orange-300 underline transition-colors whitespace-nowrap"
                                        >
                                            Limpiar filtros
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Ordenamiento - Mejorado para móviles */}
                            <div className="w-full sm:w-auto">
                                <select 
                                    value={sortBy} 
                                    onChange={(e) => setSortBy(e.target.value)} 
                                    className="w-full sm:w-auto min-w-[200px] px-4 py-2 bg-white/5 border border-white/10 rounded-lg appearance-none focus:outline-none focus:border-orange-500 cursor-pointer text-sm"
                                >
                                    <option value="newest" className="bg-[#222]">Más recientes</option>
                                    <option value="oldest" className="bg-[#222]">Más antiguos</option>
                                    <option value="price-desc" className="bg-[#222]">Precio: Mayor a menor</option>
                                    <option value="price-asc" className="bg-[#222]">Precio: Menor a mayor</option>
                                    <option value="name-asc" className="bg-[#222]">Nombre: A-Z</option>
                                </select>
                            </div>
                        </div>

                        {/* Panel de filtros expandido - Completamente responsivo */}
                        <div className={`filter-panel-transition overflow-hidden ${
                            showFilters 
                                ? 'max-h-[2000px] opacity-100 mt-4' 
                                : 'max-h-0 opacity-0 lg:max-h-[2000px] lg:opacity-100 lg:mt-4'
                        }`}>
                            <div className="mobile-filter-panel bg-black/20 rounded-xl border border-white/5 p-4">
                                <div className="grid mobile-filter-grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                                    
                                    {/* Categoría Principal */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium text-white/60 uppercase tracking-wide">Categoría</label>
                                        <select 
                                            value={selectedCategory} 
                                            onChange={(e) => {
                                                setSelectedCategory(e.target.value);
                                                setSelectedSubcategory('Todos');
                                                setSelectedBrand('Todos');
                                            }}
                                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
                                        >
                                            <option value="Todos" className="bg-[#222]">Todas las categorías</option>
                                            {Object.keys(categories).map(cat => (
                                                <option key={cat} value={cat} className="bg-[#222]">{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Subcategoría */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium text-white/60 uppercase tracking-wide">Subcategoría</label>
                                        <select 
                                            value={selectedSubcategory} 
                                            onChange={(e) => setSelectedSubcategory(e.target.value)}
                                            disabled={selectedCategory === 'Todos'}
                                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <option value="Todos" className="bg-[#222]">Todas las subcategorías</option>
                                            {availableSubcategories.map(sub => (
                                                <option key={sub} value={sub} className="bg-[#222]">{sub}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Marca */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium text-white/60 uppercase tracking-wide">Marca</label>
                                        <select 
                                            value={selectedBrand} 
                                            onChange={(e) => setSelectedBrand(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
                                        >
                                            <option value="Todos" className="bg-[#222]">Todas las marcas</option>
                                            {availableBrands.map(brand => (
                                                <option key={brand} value={brand} className="bg-[#222]">{brand}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Género */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium text-white/60 uppercase tracking-wide">Género</label>
                                        <select 
                                            value={selectedGender} 
                                            onChange={(e) => setSelectedGender(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
                                        >
                                            <option value="Todos" className="bg-[#222]">Todos los géneros</option>
                                            {genders.map(gender => (
                                                <option key={gender} value={gender} className="bg-[#222]">{gender}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Condición */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium text-white/60 uppercase tracking-wide">Condición</label>
                                        <select 
                                            value={selectedCondition} 
                                            onChange={(e) => setSelectedCondition(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
                                        >
                                            <option value="Todos" className="bg-[#222]">Todas las condiciones</option>
                                            {conditions.map(condition => (
                                                <option key={condition} value={condition} className="bg-[#222]">{condition}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Precio - Mejorado para móviles */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium text-white/60 uppercase tracking-wide">Precio (Bs.)</label>
                                        <div className="flex mobile-price-inputs gap-2">
                                            <input
                                                type="number"
                                                placeholder="Mínimo"
                                                value={priceRange.min}
                                                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Máximo"
                                                value={priceRange.max}
                                                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Botón de limpiar filtros - Solo visible en móvil cuando hay filtros activos */}
                                {hasActiveFilters && (
                                    <div className="mt-4 pt-4 border-t border-white/10 lg:hidden">
                                        <button 
                                            onClick={clearAllFilters}
                                            className="w-full px-4 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors text-sm font-medium border border-orange-500/30"
                                        >
                                            Limpiar todos los filtros
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- CONTADOR DE RESULTADOS --- */}
                    {processedProducts.length > 0 && (
                        <div className="mb-6 text-white/70 text-sm">
                            {processedProducts.length} producto{processedProducts.length !== 1 ? 's' : ''} encontrado{processedProducts.length !== 1 ? 's' : ''}
                            {hasActiveFilters && <span className="text-orange-400"> (filtrado)</span>}
                        </div>
                    )}

                    {/* --- SECCIÓN DE RESULTADOS --- */}
                    {processedProducts.length === 0 && !loading ? (
                        <div className="text-center text-white/50 py-20">
                            <Inbox size={64} className="mx-auto mb-4 text-white/20"/>
                            <p className="text-2xl font-semibold">No se encontraron productos</p>
                            <p className="mt-2">
                                {hasActiveFilters 
                                    ? 'Intenta ajustar los filtros o términos de búsqueda.' 
                                    : 'Aún no hay productos disponibles.'}
                            </p>
                            {hasActiveFilters && (
                                <button 
                                    onClick={clearAllFilters}
                                    className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                                >
                                    Limpiar todos los filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {/* Productos Premium - CON FUNCIONALIDAD MOSTRAR MÁS/MENOS */}
                            {premiumProducts.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 flex items-center justify-center bg-orange-500/20 rounded-full">
                                            <Star className="text-orange-400" size={24} />
                                        </div>
                                        <h2 className="text-3xl font-bold text-white">
                                            Destacados {hasActiveFilters && `(${premiumProducts.length})`}
                                        </h2>
                                    </div>
                                    
                                    <ProductGrid products={displayedPremiumProducts} />
                                    
                                    {/* Botón Mostrar Más/Menos - Solo si hay más productos de los que se muestran inicialmente */}
                                    {premiumProducts.length > PREMIUM_INITIAL_COUNT && (
                                        <div className="flex justify-center mt-8">
                                            <button
                                                onClick={() => setShowAllPremium(!showAllPremium)}
                                                className="show-more-button flex items-center gap-3 px-8 py-3 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105"
                                            >
                                                {showAllPremium ? (
                                                    <>
                                                        <ChevronUp size={20} />
                                                        Mostrar menos productos destacados
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown size={20} />
                                                        Mostrar {premiumProducts.length - PREMIUM_INITIAL_COUNT} productos destacados más
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Productos Regulares */}
                            {regularProducts.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 flex items-center justify-center bg-orange-500/20 rounded-full">
                                            <ShoppingBag className="text-orange-400" size={24} />
                                        </div>
                                        <h2 className="text-3xl font-bold text-white">
                                            {selectedCategory !== 'Todos' 
                                                ? `${selectedCategory}${hasActiveFilters ? ` (${regularProducts.length})` : ''}` 
                                                : `Explora lo Nuevo${hasActiveFilters ? ` (${regularProducts.length})` : ''}`}
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