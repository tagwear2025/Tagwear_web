'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast, Toaster } from 'react-hot-toast';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

export default function EditProductoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { productId } = params;

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProductData = useCallback(async () => {
    if (!productId || !user) return;
    try {
      const productRef = doc(db, 'products', productId);
      const docSnap = await getDoc(productRef);
      if (docSnap.exists()) {
        const productData = docSnap.data();
        if (user.uid !== productData.userId) {
          toast.error("No tienes permiso para editar este producto.");
          router.push('/app/pages/Profile_Ventas');
          return;
        }
        setFormData({
          nombre: productData.nombre || '',
          descripcion: productData.descripcion || '',
          precio: productData.precio || 0,
          categoria: productData.categoria || '',
          stock: productData.stock || 0,
          tallas: productData.tallas || [],
        });
      } else {
        toast.error("Producto no encontrado.");
        router.push('/app/pages/Profile_Ventas');
      }
    } catch (error) {
      toast.error("Error al cargar el producto.");
    } finally {
      setLoading(false);
    }
  }, [productId, user, router]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTallaChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
        const tallas = prev.tallas;
        if (checked) {
            return { ...prev, tallas: [...tallas, value] };
        } else {
            return { ...prev, tallas: tallas.filter(t => t !== value) };
        }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('Actualizando producto...');
    try {
      const response = await fetch(`/api/productos/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            precio: parseFloat(formData.precio),
            stock: parseInt(formData.stock, 10),
        }),
      });
      if (!response.ok) throw new Error('Error al actualizar.');
      toast.success('Producto actualizado con éxito', { id: loadingToast });
      router.push('/app/pages/Profile_Ventas');
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tallasDisponibles = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const categoriasDisponibles = ['Poleras', 'Pantalones', 'Chaquetas', 'Zapatos', 'Accesorios'];

  if (loading || !formData) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" size={48}/></div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      <Toaster position="bottom-right" />
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 mb-6">
            <ArrowLeft size={20} /> Volver a Mis Productos
        </button>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Editar Producto</h1>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Producto</label>
                        <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"/>
                    </div>
                    <div>
                        <label htmlFor="precio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio (en Bs.)</label>
                        <input type="number" id="precio" name="precio" value={formData.precio} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"/>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                        <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleFormChange} rows="4" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"></textarea>
                    </div>
                    <div>
                        <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                        <select id="categoria" name="categoria" value={formData.categoria} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            {categoriasDisponibles.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad en Stock</label>
                        <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" min="0"/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tallas Disponibles</label>
                        <div className="flex flex-wrap gap-3">
                            {tallasDisponibles.map(talla => (
                            <label key={talla} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" value={talla} checked={formData.tallas.includes(talla)} onChange={handleTallaChange} className="h-5 w-5 rounded text-blue-600"/>
                                <span className="text-gray-800 dark:text-gray-200">{talla}</span>
                            </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
                    <span>Guardar Cambios</span>
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}
