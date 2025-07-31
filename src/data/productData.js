// src/data/productData.js

/**
 * Estructura de datos centralizada para las categorías, marcas y filtros de productos.
 * Esto facilita la gestión y actualización de las opciones del formulario.
 */

// Estructura de categorías y subcategorías anidadas.
export const categories = {
    'Ropa Superior 👕': ['Poleras', 'Camisas', 'Musculosas', 'Blusas', 'Buzos', 'Suéteres', 'Hoodies', 'Chaquetas', 'Crop tops'],
    'Ropa Inferior 👖': ['Pantalones', 'Pantalones anchos', 'Joggers', 'Jeans', 'Shorts', 'Faldas', 'Leggings', 'Cargo pants'],
    'Calzado 👟': ['Zapatillas urbanas', 'Zapatillas deportivas', 'Zapatos de vestir', 'Sandalias', 'Botas', 'Botines'],
    'Accesorios 🎒': ['Gorras', 'Gorros', 'Cinturones', 'Bufandas', 'Mochilas', 'Lentes de sol', 'Joyería', 'Bolsos'],
    'Electrónicos 🔌': ['Celulares y Tablets', 'Computadoras y Laptops', 'Audio y Parlantes', 'Televisores y Video', 'Videojuegos y Consolas', 'Accesorios Electrónicos'],
    'Otros Artículos 🧢': ['Libros y Revistas', 'Artículos de colección', 'Decoración', 'Instrumentos musicales', 'Equipamiento deportivo'],
};

// Lista de marcas populares para ROPA Y ACCESORIOS.
export const clothingBrands = [
    'Nike', 'Adidas', 'Puma', 'Reebok', 'Vans', 'Converse', "Levi's", 
    'H&M', 'Zara', 'Bershka', 'Stradivarius', 'Pull&Bear', 'SHEIN', 'Uniqlo', 
    'Under Armour', 'Columbia', 'The North Face', 'Supreme', 'BAPE', 'Balenciaga', 
    'Gucci', 'Louis Vuitton', 'Tommy Hilfiger', 'Calvin Klein'
];

// Lista de marcas populares para ELECTRÓNICOS.
export const electronicBrands = [
    'Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Google', 'Sony', 'LG', 'HP', 'Dell',
    'Lenovo', 'Asus', 'Acer', 'Microsoft', 'JBL', 'Bose', 'Nintendo', 'PlayStation'
];

// Opciones para los filtros adicionales, con "Otro" al final.
export const styles = ['Formal', 'Casual', 'Urbano', 'Deportivo', 'Streetwear', 'Vintage', 'Elegante', 'Otro'];
export const genders = ['Hombre', 'Mujer', 'Unisex'];
export const conditions = ['Nuevo (sellado)', 'Nuevo (abierto)', 'Usado - Como nuevo', 'Usado - Buen estado', 'Usado - Con detalles'];
export const materials = ['Algodón', 'Poliéster', 'Jean', 'Lana', 'Seda', 'Cuero', 'Sintético', 'Lino', 'Otro'];

// Tallas estándar.
export const standardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
