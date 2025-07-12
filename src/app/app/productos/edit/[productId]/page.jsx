'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast, Toaster } from 'react-hot-toast';
import { Loader2, Save, ArrowLeft, Tag } from 'lucide-react';

const tallasDisponibles = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const categoriasDisponibles = ['Poleras', 'Pantalones', 'Chaquetas', 'Zapatos', 'Accesorios'];

export default function EditProductoPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { productId } = params;

    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ Estados para el sistema de tallas y precio de oferta
    const [tallaType, setTallaType] = useState('standard');
    const [customTalla, setCustomTalla] = useState('');

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
                
                // ✅ Lógica para determinar el tipo de talla al cargar
                const savedTallas = productData.tallas || [];
                const isCustom = savedTallas.length === 1 && !tallasDisponibles.includes(savedTallas[0]);

                if (isCustom) {
                    setTallaType('custom');
                    setCustomTalla(savedTallas[0]);
                    productData.tallas = []; // Limpiar para no marcar checkboxes
                } else {
                    setTallaType('standard');
                    setCustomTalla('');
                }

                setFormData({
                    nombre: productData.nombre || '',
                    descripcion: productData.descripcion || '',
                    precio: productData.precio || 0,
                    precioOferta: productData.precioOferta || '', // Cargar precio de oferta
                    categoria: productData.categoria || '',
                    stock: productData.stock || 0,
                    tallas: isCustom ? [] : savedTallas, // Asignar tallas estándar si aplica
                });

            } else {
                toast.error("Producto no encontrado.");
                router.push('/app/pages/Profile_Ventas');
            }
        } catch (error) {
            toast.error("Error al cargar el producto.");
            console.error(error);
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
            const currentTallas = prev.tallas || [];
            const newTallas = checked ? [...currentTallas, value] : currentTallas.filter(t => t !== value);
            return { ...prev, tallas: newTallas };
        });
    };
    
    // ✅ NUEVO: Manejador para cambiar el tipo de talla
    const handleTallaTypeChange = (type) => {
        setTallaType(type);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // ✅ VALIDACIÓN MEJORADA
        const tallasAreValid = (tallaType === 'standard' && formData.tallas.length > 0) || (tallaType === 'custom' && customTalla.trim() !== '');
        if (!tallasAreValid) {
            toast.error('Debes especificar al menos una talla.');
            return;
        }
        if (formData.precioOferta && parseFloat(formData.precioOferta) >= parseFloat(formData.precio)) {
            toast.error('El precio de oferta debe ser menor que el precio original.');
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Actualizando producto...');

        try {
            const finalTallas = tallaType === 'standard' ? formData.tallas : [customTalla.trim()];
            
            const dataToUpdate = {
                ...formData,
                precio: parseFloat(formData.precio),
                precioOferta: formData.precioOferta ? parseFloat(formData.precioOferta) : null, // Enviar null para borrar
                stock: parseInt(formData.stock, 10),
                tallas: finalTallas,
                updatedAt: serverTimestamp(),
            };
            
            // Si el precio de oferta está vacío, lo eliminamos del objeto para que Firestore lo borre
            if (!dataToUpdate.precioOferta) {
                delete dataToUpdate.precioOferta;
            }

            const productRef = doc(db, 'products', productId);
            await updateDoc(productRef, dataToUpdate);
            
            toast.success('Producto actualizado con éxito', { id: loadingToast });
            router.push('/app/pages/Profile_Ventas');

        } catch (error) {
            toast.error(error.message, { id: loadingToast });
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !formData) return <div className="flex justify-center items-center h-screen bg-gray-900"><Loader2 className="animate-spin text-white" size={48}/></div>

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
            <Toaster position="bottom-right" />
            <div className="max-w-4xl mx-auto">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 mb-6 transition-colors">
                    <ArrowLeft size={20} /> Volver
                </button>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Editar Producto</h1>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* --- Información del Producto --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Producto</label>
                                <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"/>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleFormChange} rows="4" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"></textarea>
                            </div>
                             <div>
                                <label htmlFor="precio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio Original (Bs.)</label>
                                <input type="number" id="precio" name="precio" value={formData.precio} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"/>
                            </div>
                            <div>
                                <label htmlFor="precioOferta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio de Oferta (Opcional)</label>
                                <input type="number" id="precioOferta" name="precioOferta" value={formData.precioOferta} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" placeholder="Dejar vacío para quitar"/>
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
                        </div>

                        {/* ✅ SECCIÓN DE TALLAS MEJORADA */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tallas Disponibles</label>
                            <div className="flex items-center gap-4 mb-4">
                                <button type="button" onClick={() => handleTallaTypeChange('standard')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tallaType === 'standard' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>
                                    Tallas Estándar
                                </button>
                                <button type="button" onClick={() => handleTallaTypeChange('custom')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tallaType === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>
                                    Talla Personalizada / Única
                                </button>
                            </div>
                            
                            {tallaType === 'standard' && (
                                <div className="flex flex-wrap gap-x-6 gap-y-3 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                    {tallasDisponibles.map(talla => (
                                        <label key={talla} className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" value={talla} checked={formData.tallas.includes(talla)} onChange={handleTallaChange} className="h-5 w-5 rounded text-blue-600"/>
                                            <span className="text-gray-800 dark:text-gray-200 font-medium">{talla}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {tallaType === 'custom' && (
                                <div className="relative">
                                    <Tag className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={18}/>
                                    <input 
                                        type="text" 
                                        value={customTalla} 
                                        onChange={(e) => setCustomTalla(e.target.value)} 
                                        className="w-full p-3 pl-10 bg-gray-100 dark:bg-gray-700 rounded-lg" 
                                        placeholder="Ej: Talla Única, 42, Ajustable..." 
                                    />
                                </div>
                            )}
                        </div>
                        
                        {/* --- Botón de Envío --- */}
                        <div className="pt-4 flex justify-end">
                            <button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
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
