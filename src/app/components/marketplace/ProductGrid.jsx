'use client';

import ProductCard from './ProductCard';

// Componente para mostrar la cuadrícula de productos estilo Pinterest
export default function ProductGrid({ products }) {
  // Verificación para asegurar que 'products' es un array
  if (!Array.isArray(products) || products.length === 0) {
    return <p className="text-center text-gray-500">No hay productos para mostrar.</p>;
  }

  return (
    // MEJORA: Reemplazamos el estilo en línea por clases de Tailwind para un diseño responsivo.
    // - Móviles: 2 columnas (por defecto)
    // - Tablets (sm): 3 columnas
    // - Pantallas grandes (lg): 4 columnas
    // - Pantallas extra grandes (xl): 5 columnas
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
