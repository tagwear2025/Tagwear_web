'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { 
    Loader, 
    MapPin, 
    User, 
    Tag, 
    Info, 
    ImageIcon, 
    Package, 
    CheckCircle, 
    XCircle, 
    MessageSquare,
    Star,
    Shield,
    Palette,
    Fabric,
    Users,
    Zap,
    Calendar,
    Award
} from 'lucide-react';

// --- Componente para el carrusel de imágenes (Mejorado) ---
const ImageCarousel = ({ images, alt }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="w-full aspect-square bg-black/30 border border-white/10 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                    <ImageIcon className="text-white/30 mx-auto mb-2" size={64} />
                    <p className="text-white/50 text-sm">Sin imágenes disponibles</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Imagen principal con contador */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                <img
                    src={images[currentIndex]}
                    alt={`${alt} - Imagen ${currentIndex + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                />
                {images.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}
            </div>
            
            {/* Thumbnails mejorados */}
            {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20">
                    {images.map((src, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-20 h-20 rounded-lg flex-shrink-0 overflow-hidden border-2 transition-all duration-200 ${
                                currentIndex === index 
                                    ? 'border-orange-500 shadow-lg shadow-orange-500/30 scale-105' 
                                    : 'border-transparent hover:border-white/50 hover:scale-102'
                            }`}
                        >
                            <img src={src} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Componente para mostrar badges de información ---
const InfoBadge = ({ icon: Icon, label, value, color = "blue" }) => {
    if (!value) return null;
    
    const colorClasses = {
        blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        green: "bg-green-500/20 text-green-300 border-green-500/30",
        orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
        purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        pink: "bg-pink-500/20 text-pink-300 border-pink-500/30",
        gray: "bg-gray-500/20 text-gray-300 border-gray-500/30"
    };

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClasses[color]} transition-all duration-200 hover:scale-105`}>
            <Icon size={16} />
            <span className="text-sm font-medium">
                <span className="text-white/60">{label}:</span> {value}
            </span>
        </div>
    );
};

// --- Componente para el descuento ---
const DiscountBadge = ({ originalPrice, offerPrice }) => {
    if (!offerPrice || offerPrice >= originalPrice) return null;
    
    const discount = Math.round(((originalPrice - offerPrice) / originalPrice) * 100);
    
    return (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold px-3 py-1 rounded-full text-sm shadow-lg animate-pulse">
            -{discount}%
        </div>
    );
};

export default function ProductDetailPage() {
    const params = useParams();
    const { productId } = params;
    const [product, setProduct] = useState(null);
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!productId) return;
        const productRef = doc(db, 'products', productId);
        const unsubscribe = onSnapshot(productRef, async (productSnap) => {
            if (productSnap.exists()) {
                const productData = { id: productSnap.id, ...productSnap.data() };
                setProduct(productData);
                if (productData.userId && (!seller || seller.id !== productData.userId)) {
                    const sellerRef = doc(db, 'users', productData.userId);
                    const sellerSnap = await getDoc(sellerRef);
                    if (sellerSnap.exists()) {
                        setSeller({id: sellerSnap.id, ...sellerSnap.data()});
                    } else {
                        setSeller({ nombres: productData.vendedorNombre || 'Vendedor Anónimo', lugarResidencia: 'Desconocida' });
                    }
                }
            } else {
                setError('Producto no encontrado');
            }
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError('Error al cargar el producto.');
            setLoading(false);
        });
        return () => unsubscribe();
    }, [productId, seller]);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[80vh] bg-[#111]">
                <Loader className="animate-spin text-orange-500 mb-4" size={48} />
                <p className="text-white/70">Cargando producto...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 bg-[#111]">
                <XCircle className="text-red-400 mx-auto mb-4" size={64} />
                <p className="text-red-400 text-xl font-semibold">{error}</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-20 bg-[#111]">
                <Package className="text-white/30 mx-auto mb-4" size={64} />
                <p className="text-white/70 text-xl">Producto no disponible.</p>
            </div>
        );
    }
    
    const isAvailable = product.estado === 'disponible';
    const hasOffer = product.precioOferta && parseFloat(product.precioOferta) > 0;
    const originalPrice = parseFloat(product.precio);
    const offerPrice = hasOffer ? parseFloat(product.precioOferta) : null;
    const whatsappLink = seller?.telefono && isAvailable
        ? `https://wa.me/591${seller.telefono}?text=Hola, me interesa tu producto "${product.nombre}" que vi en Tagwear.`
        : null;

    // Formatear fecha de creación
    const formatDate = (date) => {
        if (!date) return null;
        const dateObj = date.toDate ? date.toDate() : new Date(date);
        return dateObj.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <>
            <style jsx global>{`
                .scrollbar-thin {
                    scrollbar-width: thin;
                }
                .scrollbar-thumb-white\/20::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.2);
                    border-radius: 9999px;
                }
                .scrollbar-thin::-webkit-scrollbar {
                    height: 6px;
                }
                .hover\\:scale-102:hover {
                    transform: scale(1.02);
                }
            `}</style>

            <div className="min-h-screen bg-[#111] text-white">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
                        
                        {/* --- SECCIÓN DE IMÁGENES --- */}
                        <div className="lg:col-span-3">
                            <ImageCarousel images={product.imageUrls} alt={product.nombre} />
                        </div>

                        {/* --- SECCIÓN DE INFORMACIÓN DEL PRODUCTO --- */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* --- INFORMACIÓN PRINCIPAL Y PRECIO --- */}
                            <div className="bg-black/30 backdrop-blur-lg border border-white/10 p-6 rounded-2xl space-y-4 relative overflow-hidden">
                                {/* Badge de descuento */}
                                {hasOffer && <DiscountBadge originalPrice={originalPrice} offerPrice={offerPrice} />}
                                
                                {/* Badge de producto premium */}
                                {product.isPremium && (
                                    <div className="absolute top-4 left-4 flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        <Star size={12} fill="currentColor" />
                                        Destacado
                                    </div>
                                )}

                                <div className="flex justify-between items-start gap-4">
                                    <h1 className="text-3xl font-bold text-white leading-tight">{product.nombre}</h1>
                                    <span className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                                        isAvailable ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                    }`}>
                                        {isAvailable ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                                        {isAvailable ? 'Disponible' : 'Vendido'}
                                    </span>
                                </div>

                                {/* --- SECCIÓN DE PRECIO MEJORADA --- */}
                                <div className="space-y-2">
                                    {hasOffer ? (
                                        <div className="space-y-1">
                                            <div className="flex items-baseline gap-3">
                                                <p className="text-4xl md:text-5xl font-extrabold text-orange-400">
                                                    Bs. {offerPrice.toFixed(2)}
                                                </p>
                                                <p className="text-xl md:text-2xl font-bold text-white/50 line-through">
                                                    Bs. {originalPrice.toFixed(2)}
                                                </p>
                                            </div>
                                            <p className="text-green-400 text-sm font-semibold">
                                                ¡Ahorras Bs. {(originalPrice - offerPrice).toFixed(2)}!
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-4xl md:text-5xl font-extrabold text-orange-400">
                                            Bs. {originalPrice.toFixed(2)}
                                        </p>
                                    )}
                                </div>
                                
                                {/* --- INFORMACIÓN BÁSICA --- */}
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <InfoBadge icon={Tag} label="Categoría" value={product.categoriaPrincipal} color="blue" />
                                    <InfoBadge icon={Package} label="Stock" value={product.stock} color="green" />
                                    {product.subcategoria && (
                                        <InfoBadge icon={Tag} label="Subcategoría" value={product.subcategoria} color="purple" />
                                    )}
                                    {product.marca && (
                                        <InfoBadge icon={Award} label="Marca" value={product.marca} color="orange" />
                                    )}
                                </div>
                            </div>

                            {/* --- DETALLES ESPECÍFICOS --- */}
                            <div className="bg-black/30 backdrop-blur-lg border border-white/10 p-6 rounded-2xl space-y-4">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Info size={20}/> Detalles del Producto
                                </h2>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {product.condicion && (
                                        <InfoBadge icon={Shield} label="Condición" value={product.condicion} color="green" />
                                    )}
                                    {product.genero && (
                                        <InfoBadge icon={Users} label="Género" value={product.genero} color="pink" />
                                    )}
                                    {product.estilo && (
                                        <InfoBadge icon={Palette} label="Estilo" value={product.estilo} color="purple" />
                                    )}
                                    {product.material && (
                                        <InfoBadge icon={Fabric} label="Material" value={product.material} color="blue" />
                                    )}
                                </div>

                                {/* --- TALLAS DISPONIBLES (MEJORADO) --- */}
                                {product.tallas && product.tallas.length > 0 && (
                                    <div className="pt-4">
                                        <h3 className="font-semibold text-white/80 mb-3 flex items-center gap-2">
                                            <Tag size={16} />
                                            Tallas Disponibles:
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {product.tallas.map((talla, index) => (
                                                <span 
                                                    key={index} 
                                                    className="px-4 py-2 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 text-sm font-medium rounded-full hover:from-orange-500/20 hover:to-orange-400/20 hover:border-orange-500/50 transition-all duration-200"
                                                >
                                                    {talla}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* --- FECHA DE PUBLICACIÓN --- */}
                                {product.fechaCreacion && (
                                    <div className="pt-2 border-t border-white/10">
                                        <InfoBadge 
                                            icon={Calendar} 
                                            label="Publicado el" 
                                            value={formatDate(product.fechaCreacion)} 
                                            color="gray" 
                                        />
                                    </div>
                                )}
                            </div>

                            {/* --- DESCRIPCIÓN MEJORADA --- */}
                            <div className="bg-black/30 backdrop-blur-lg border border-white/10 p-6 rounded-2xl">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Info size={20}/> Descripción
                                </h2>
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                                        {product.descripcion}
                                    </p>
                                </div>
                            </div>

                            {/* --- OTROS DETALLES (SI EXISTEN) --- */}
                            {product.otrosDetalles && (
                                <div className="bg-black/30 backdrop-blur-lg border border-white/10 p-6 rounded-2xl">
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Zap size={20}/> Información Adicional
                                    </h2>
                                    <div className="prose prose-invert max-w-none">
                                        <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                                            {product.otrosDetalles}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* --- INFORMACIÓN DEL VENDEDOR --- */}
                            {seller && product.userId && (
                                <Link href={`/app/pages/LupaUsers/viewPerfilUsers/${product.userId}`} className="block group">
                                    <div className="bg-black/30 backdrop-blur-lg border border-white/10 p-6 rounded-2xl transition-all duration-300 group-hover:border-orange-500/50 group-hover:shadow-xl group-hover:shadow-orange-500/10 group-hover:scale-[1.02]">
                                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <User size={20}/> Vendedor
                                        </h2>
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img 
                                                    src={seller.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.nombres)}&background=f97316&color=fff`} 
                                                    alt={seller.nombres} 
                                                    className="w-16 h-16 rounded-full object-cover border-2 border-white/10 group-hover:border-orange-500/50 transition-colors"
                                                />
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#111]"></div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-lg text-white group-hover:text-orange-400 transition-colors">
                                                    {seller.nombres}
                                                </p>
                                                <p className="flex items-center text-sm text-white/60">
                                                    <MapPin size={14} className="mr-1"/> 
                                                    {seller.lugarResidencia || 'Ubicación no especificada'}
                                                </p>
                                                <p className="text-xs text-white/40 mt-1">
                                                    Click para ver perfil completo
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {/* --- BOTÓN DE CONTACTO MEJORADO --- */}
                            <div className="sticky bottom-4 z-10">
                                <a 
                                    href={whatsappLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className={`w-full flex items-center justify-center gap-3 px-6 py-4 font-bold text-lg rounded-full transition-all duration-300 shadow-lg ${
                                        whatsappLink 
                                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105 shadow-green-500/30 hover:shadow-green-500/50' 
                                            : 'bg-white/10 text-white/40 cursor-not-allowed'
                                    }`}
                                    aria-disabled={!whatsappLink}
                                    onClick={(e) => !whatsappLink && e.preventDefault()}
                                >
                                    <MessageSquare size={24} />
                                    <span>
                                        {isAvailable 
                                            ? '💬 Contactar por WhatsApp' 
                                            : '❌ Producto no disponible'
                                        }
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}