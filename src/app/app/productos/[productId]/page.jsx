'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import Image from 'next/image';
import { Loader, MapPin, User, Tag, MessageSquare, Info, Image as ImageIcon, ChevronLeft, ChevronRight, Package, CheckCircle, XCircle } from 'lucide-react';

// Componente para el carrusel de imágenes
const ImageCarousel = ({ images, alt }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToPrevious = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    if (!images || images.length === 0) {
        return <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"><ImageIcon className="text-gray-400" size={64}/></div>
    }

    return (
        <div className="relative w-full h-96">
            <Image
                src={images[currentIndex]}
                alt={alt}
                layout="fill"
                objectFit="contain"
                className="rounded-lg"
            />
            {images.length > 1 && (
                <>
                    <button onClick={goToPrevious} className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition"><ChevronLeft size={24}/></button>
                    <button onClick={goToNext} className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition"><ChevronRight size={24}/></button>
                </>
            )}
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

    // Escuchar cambios en el producto en tiempo real
    const productRef = doc(db, 'products', productId);
    const unsubscribe = onSnapshot(productRef, async (productSnap) => {
      if (productSnap.exists()) {
        const productData = productSnap.data();
        setProduct(productData);

        // Obtener al vendedor (esto no necesita ser en tiempo real a menos que cambie)
        if (productData.userId && !seller) {
          const sellerRef = doc(db, 'users', productData.userId);
          const sellerSnap = await getDoc(sellerRef);
          if (sellerSnap.exists()) {
            setSeller(sellerSnap.data());
          } else {
            setSeller({ nombres: productData.vendedorNombre, lugarResidencia: 'Desconocida' });
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
  }, [productId, seller]); // Dependencia de 'seller' para evitar re-fetch innecesario

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Loader className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">Error: {error}</div>;
  }

  if (!product) {
    return <div className="text-center py-20">Producto no disponible.</div>;
  }
  
  const isAvailable = product.estado === 'disponible';
  const whatsappLink = seller?.telefono && isAvailable
    ? `https://wa.me/591${seller.telefono}?text=Hola, me interesa tu producto "${product.nombre}" que vi en Tagwear.`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          <div className="lg:col-span-3">
            <ImageCarousel images={product.imageUrls} alt={product.nombre} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{product.nombre}</h1>
                    {/* AÑADIDO: Badge de estado */}
                    <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${isAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {isAvailable ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                        {isAvailable ? 'Disponible' : 'Vendido'}
                    </span>
                </div>

                <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-4">Bs. {product.precio.toFixed(2)}</p>
                
                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
                    <Tag size={16} className="mr-2"/>
                    <span>Categoría: {product.categoria}</span>
                </div>
                
                {/* AÑADIDO: Mostrar Stock */}
                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
                    <Package size={16} className="mr-2"/>
                    <span>Stock: {product.stock} unidades</span>
                </div>

                <div className="space-y-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Tallas Disponibles:</h3>
                    <div className="flex flex-wrap gap-2">
                        {product.tallas.map(talla => (
                            <span key={talla} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm font-medium rounded-full">{talla}</span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Info size={20}/> Descripción</h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{product.descripcion}</p>
            </div>

            {seller && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><User size={20}/> Información del Vendedor</h2>
                    <div className="flex items-center gap-4">
                        <img src={seller.photoURL || `https://ui-avatars.com/api/?name=${seller.nombres}`} alt={seller.nombres} className="w-16 h-16 rounded-full object-cover"/>
                        <div>
                            <p className="font-bold text-lg">{seller.nombres}</p>
                            <p className="flex items-center text-sm text-gray-500 dark:text-gray-400"><MapPin size={14} className="mr-1"/> {seller.lugarResidencia}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* AÑADIDO: Lógica condicional para el botón */}
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" 
               className={`w-full flex items-center justify-center gap-3 px-6 py-4 font-bold text-lg rounded-lg transition-transform transform shadow-lg 
                          ${whatsappLink ? 'bg-green-500 text-white hover:bg-green-600 hover:scale-105' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
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
