// 3. Crea este archivo en: src/app/components/marketplace/ProductGrid.jsx
'use client';

import ProductCard from './ProductCard';

export default function ProductGrid({ products }) {
  return (
    <div 
      className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-4"
    >
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}