'use client';

import ProductCard from './ProductCard';

// Componente para mostrar la cuadrícula de productos estilo Pinterest
export default function ProductGrid({ products }) {
  // Verificación para asegurar que 'products' es un array
  if (!Array.isArray(products)) {
    return <p>No hay productos para mostrar.</p>;
  }

  return (
    <div 
      className="w-full"
      style={{
        columnCount: 'auto',
        columnWidth: '250px', // Ancho base de cada columna
        columnGap: '1rem',
      }}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
