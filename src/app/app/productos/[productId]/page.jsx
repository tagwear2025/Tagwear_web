'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Loader, MapPin, User, Tag, Info, ImageIcon, Package, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

// --- Componente para el carrusel de imágenes (Rediseñado) ---
const ImageCarousel = ({ images, alt }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="w-full aspect-square bg-black/30 border border-white/10 rounded-2xl flex items-center justify-center">
                <ImageIcon className="text-white/30" size={64} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10">
                <img
                    src={images[currentIndex]}
                    alt={`${alt} - Imagen ${currentIndex + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                />
            </div>
            {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {images.map((src, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-20 h-20 rounded-lg flex-shrink-0 overflow-hidden border-2 transition-colors duration-200 ${currentIndex === index ? 'border-orange-500' : 'border-transparent hover:border-white/50'}`}
                        >
                            <img src={src} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function ProductDetailPage() {
    // --- LÓGICA DE ESTADOS Y DATOS (INTACTA) ---
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
    }, [productId]);

    // --- RENDERIZADO (ESTILOS RENOVADOS) ---
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[80vh] bg-[#111]">
                <Loader className="animate-spin text-orange-500" size={48} />
            </div>
        );
    }

    if (error) {
        return <div className="text-center py-20 text-red-400 bg-[#111]">{error}</div>;
    }

    if (!product) {
        return <div className="text-center py-20 text-white/70 bg-[#111]">Producto no disponible.</div>;
    }
    
    const isAvailable = product.estado === 'disponible';
    const whatsappLink = seller?.telefono && isAvailable
        ? `https://wa.me/591${seller.telefono}?text=Hola, me interesa tu producto "${product.nombre}" que vi en Tagwear.`
        : null;

    return (
        <div className="min-h-screen bg-[#111] text-white">
            <div className="container mx-auto p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
                    
                    <div className="lg:col-span-3">
                        <ImageCarousel images={product.imageUrls} alt={product.nombre} />
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-black/30 backdrop-blur-lg border border-white/10 p-6 rounded-2xl space-y-4">
                            <div className="flex justify-between items-start gap-4">
                                <h1 className="text-3xl font-bold text-white">{product.nombre}</h1>
                                <span className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${isAvailable ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                    {isAvailable ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                                    {isAvailable ? 'Disponible' : 'Vendido'}
                                </span>
                            </div>

                            <p className="text-5xl font-extrabold text-orange-400">Bs. {product.precio.toFixed(2)}</p>
                            
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/60 pt-2">
                                <div className="flex items-center gap-2"><Tag size={16}/><span>{product.categoria}</span></div>
                                <div className="flex items-center gap-2"><Package size={16}/><span>Stock: {product.stock}</span></div>
                            </div>

                            {product.tallas && product.tallas.length > 0 && (
                                <div className="pt-2">
                                    <h3 className="font-semibold text-white/80 mb-2">Tallas Disponibles:</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {product.tallas.map(talla => (
                                            <span key={talla} className="px-3 py-1 bg-white/10 text-sm font-medium rounded-full">{talla}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-black/30 backdrop-blur-lg border border-white/10 p-6 rounded-2xl">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Info size={20}/> Descripción</h2>
                            <p className="text-white/80 whitespace-pre-wrap">{product.descripcion}</p>
                        </div>

                        {seller && product.userId && (
                          <Link href={`/app/pages/LupaUsers/viewPerfilUsers/${product.userId}`} className="block group">
                              <div className="bg-black/30 backdrop-blur-lg border border-white/10 p-6 rounded-2xl transition-all duration-300 group-hover:border-orange-500/50 group-hover:shadow-xl group-hover:shadow-orange-500/10">
                                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><User size={20}/> Vendedor</h2>
                                  <div className="flex items-center gap-4">
                                      <img src={seller.photoURL || `https://ui-avatars.com/api/?name=${seller.nombres}`} alt={seller.nombres} className="w-16 h-16 rounded-full object-cover"/>
                                      <div>
                                          <p className="font-bold text-lg text-white">{seller.nombres}</p>
                                          <p className="flex items-center text-sm text-white/60"><MapPin size={14} className="mr-1"/> {seller.lugarResidencia}</p>
                                      </div>
                                  </div>
                              </div>
                          </Link>
                        )}

                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" 
                           className={`w-full flex items-center justify-center gap-3 px-6 py-4 font-bold text-lg rounded-full transition-transform transform shadow-lg 
                                     ${whatsappLink ? 'bg-green-500 text-white hover:bg-green-600 hover:scale-105 shadow-green-500/20' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
                           aria-disabled={!whatsappLink}
                           onClick={(e) => !whatsappLink && e.preventDefault()}>
                            <MessageSquare />
                            <span>{isAvailable ? 'Contactar por WhatsApp' : 'Producto no disponible'}</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
