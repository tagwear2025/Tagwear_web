'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

// Componente para mostrar una tarjeta de producto individual
export default function ProductCard({ product }) {
  if (!product || !product.id) {
    return null;
  }

  const imageUrl = 
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls[0]
      : 'https://placehold.co/500x500/e0e0e0/7f7f7f?text=Imagen+no+disponible';

  return (
    // Esta estructura es correcta. 'break-inside-avoid' evita que la tarjeta se corte.
    <div className="mb-4 break-inside-avoid group cursor-pointer">
      <Link href={`/app/productos/${product.id}`}>
        <div className="relative">
          {product.isPremium && (
            <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Star size={14} />
              <span>Premium</span>
            </div>
          )}
          <Image
            src={imageUrl}
            alt={product.nombre || 'Imagen del producto'}
            width={500}
            height={500}
            className="w-full h-auto object-cover rounded-lg transition-transform duration-300 group-hover:brightness-90"
            priority={product.isPremium}
          />
        </div>
        <div className="mt-2 px-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:underline">
            {product.nombre || 'Producto sin nombre'}
          </h3>
          <div className="flex justify-between items-center mt-1">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              Bs. {product.precio ? product.precio.toFixed(2) : '0.00'}
            </p>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
              Stock: {product.stock || 0}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
