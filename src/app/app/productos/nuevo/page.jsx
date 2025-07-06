'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ImageUploader from '@/app/components/productos/ImageUploader';
import { toast, Toaster } from 'react-hot-toast';
import { Loader2, Upload } from 'lucide-react';

// Página para que los usuarios suban nuevos productos
export default function NuevoProductoPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Estado para los campos del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('');
  const [stock, setStock] = useState(1); // <-- AÑADIDO: Estado para el stock
  const [tallas, setTallas] = useState([]);
  const [files, setFiles] = useState([]); // Estado para las imágenes

  const [isLoading, setIsLoading] = useState(false);

  // Manejador para las tallas
  const handleTallaChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setTallas(prev => [...prev, value]);
    } else {
      setTallas(prev => prev.filter(talla => talla !== value));
    }
  };

  // Manejador para el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!nombre || !descripcion || !precio || !categoria || tallas.length === 0 || files.length === 0 || stock < 1) {
      toast.error('Por favor, completa todos los campos. El stock debe ser al menos 1.');
      return;
    }
    if (files.length > 5) {
        toast.error('No puedes subir más de 5 imágenes.');
        return;
    }
    if (parseFloat(precio) <= 0) {
        toast.error('El precio debe ser un número positivo.');
        return;
    }
    if (!user) {
        toast.error('Debes iniciar sesión para subir un producto.');
        router.push('/login');
        return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Subiendo producto...');

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('precio', precio);
    formData.append('categoria', categoria);
    formData.append('stock', stock); // <-- AÑADIDO: Enviar stock
    formData.append('tallas', JSON.stringify(tallas)); // Convertimos el array a JSON string
    formData.append('userId', user.uid);
    formData.append('vendedorNombre', user.displayName || user.email);
    
    // Añadimos los archivos de imagen
    files.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch('/api/productos', {
        method: 'POST',
        body: formData, // No se necesita header 'Content-Type', el navegador lo pone solo con FormData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ocurrió un error al subir el producto.');
      }

      toast.success('¡Producto subido con éxito!', { id: loadingToast });
      // Redirigir al perfil de ventas o a la página del producto
      router.push('/app/pages/Profile_Ventas');

    } catch (error) {
      console.error("Error al subir producto:", error);
      toast.error(error.message, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  const tallasDisponibles = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const categoriasDisponibles = ['Poleras', 'Pantalones', 'Chaquetas', 'Zapatos', 'Accesorios'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      <Toaster position="bottom-right" />
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Vende tu Prenda</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">Completa la información para poner tu artículo a la venta.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">Información del Producto</h2>
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Producto</label>
              <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ej: Polera de algodón con estampado" />
            </div>
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
              <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows="4" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Describe los detalles, material, estado, etc."></textarea>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">Detalles y Precio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="precio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio (en Bs.)</label>
                <input type="number" id="precio" value={precio} onChange={(e) => setPrecio(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ej: 150.00" step="0.01" min="0"/>
              </div>
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="" disabled>Selecciona una categoría</option>
                  {categoriasDisponibles.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              {/* <-- CAMPO DE STOCK AÑADIDO --> */}
              <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad en Stock</label>
                  <input type="number" id="stock" value={stock} onChange={(e) => setStock(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent" min="1"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tallas Disponibles</label>
              <div className="flex flex-wrap gap-3">
                {tallasDisponibles.map(talla => (
                  <label key={talla} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" value={talla} onChange={handleTallaChange} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"/>
                    <span className="text-gray-800 dark:text-gray-200">{talla}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">Imágenes del Producto</h2>
            <ImageUploader files={files} setFiles={setFiles} />
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all">
              {isLoading ? <Loader2 className="animate-spin" /> : <Upload />}
              <span>{isLoading ? 'Publicando...' : 'Publicar Producto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
