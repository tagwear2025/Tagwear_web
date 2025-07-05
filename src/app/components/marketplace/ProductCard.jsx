// 4. Crea este archivo en: src/app/components/marketplace/ProductCard.jsx
'use client';

import Image from 'next/image';

export default function ProductCard({ product }) {
  return (
    <div className="break-inside-avoid group relative rounded-lg overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-105">
      <Image
        src={product.imageUrl}
        alt={product.title}
        width={500}
        height={500}
        className="w-full h-auto object-cover"
        unoptimized // Necesario para imágenes de fuentes externas como Firebase Storage
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300">
        <div className="absolute bottom-0 left-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <h3 className="font-bold text-white text-lg drop-shadow-md">{product.title}</h3>
            {product.authorPhotoURL ? (
                <div className="flex items-center gap-2 mt-1">
                    <img src={product.authorPhotoURL} alt={product.authorName} className="w-6 h-6 rounded-full"/>
                    <p className="text-white text-xs font-medium drop-shadow-md">{product.authorName}</p>
                </div>
            ) : null}
        </div>
      </div>
    </div>
  );
}