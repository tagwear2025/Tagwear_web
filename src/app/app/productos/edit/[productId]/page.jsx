'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast, Toaster } from 'react-hot-toast';
import { Loader2, Save, ArrowLeft, Tag, Trash2, ImageIcon } from 'lucide-react';
import ImageUploader from '@/app/components/productos/ImageUploader'; // Importar el ImageUploader
import ComboBox from '@/app/components/ui/ComboBox'; // Importar ComboBox

// Importar todas las constantes de datos de producto para consistencia
import {
    categories,
    clothingBrands,
    electronicBrands,
    styles,
    genders,
    conditions,
    materials,
    standardSizes
} from '@/data/productData';

export default function EditProductoPage() {
    const { user } = useAuth(); // Asegúrate de que useAuth() provea el objeto 'user'
    const router = useRouter();
    const params = useParams();
    const { productId } = params;

    // --- ESTADOS DEL FORMULARIO COMPLETO ---
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        precioOferta: '',
        categoriaPrincipal: '',
        subcategoria: '',
        marca: '',
        condicion: '',
        genero: '',
        estilo: '',
        otroEstilo: '', // Para "Otro" estilo
        material: '',
        otroMaterial: '', // Para "Otro" material
        otrosDetalles: '',
        stock: 1,
        tallas: [], // Para tallas estándar
    });

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para el sistema de tallas y manejo de imágenes
    const [tallaType, setTallaType] = useState('standard');
    const [customTalla, setCustomTalla] = useState('');
    const [files, setFiles] = useState([]); // Nuevas imágenes a subir
    const [existingImageUrls, setExistingImageUrls] = useState([]); // URLs de imágenes ya en Firebase Storage
    const [imagesToDelete, setImagesToDelete] = useState([]); // URLs de imágenes a eliminar

    // Estados para opciones dinámicas
    const [subcategoriasDisponibles, setSubcategoriasDisponibles] = useState([]);
    const [marcasDisponibles, setMarcasDisponibles] = useState([]);

    const isElectronicProduct = formData.categoriaPrincipal === 'Electrónicos 🔌';

    // --- EFECTO para cargar subcategorías y marcas dinámicamente ---
    useEffect(() => {
        if (formData.categoriaPrincipal) {
            setSubcategoriasDisponibles(categories[formData.categoriaPrincipal] || []);
            setMarcasDisponibles(isElectronicProduct ? electronicBrands : clothingBrands);
        } else {
            setSubcategoriasDisponibles([]);
            setMarcasDisponibles([]);
        }
    }, [formData.categoriaPrincipal, isElectronicProduct]);

    // --- Cargar datos del producto al inicio ---
    const fetchProductData = useCallback(async () => {
        // Solo intenta cargar si hay un productId y el usuario está definido
        // Si el usuario no está definido aún (carga inicial de la app), esperar
        if (!productId || user === undefined) {
            setLoading(false);
            return;
        }

        // Si el usuario es null (no autenticado) y la página requiere autenticación
        if (!user) {
            toast.error("Debes iniciar sesión para editar este producto.");
            router.push('/login');
            return;
        }

        try {
            const productRef = doc(db, 'products', productId);
            const docSnap = await getDoc(productRef);

            if (docSnap.exists()) {
                const productData = docSnap.data();

                // Verificar que el usuario actual es el propietario del producto
                if (user.uid !== productData.userId) {
                    toast.error("No tienes permiso para editar este producto.");
                    router.push('/app/pages/Profile_Ventas');
                    return;
                }

                // Lógica para determinar el tipo de talla al cargar
                const savedTallas = productData.tallas || [];
                const isCustomTallaSaved = savedTallas.length === 1 && !standardSizes.includes(savedTallas[0]);

                if (isCustomTallaSaved) {
                    setTallaType('custom');
                    setCustomTalla(savedTallas[0]);
                } else {
                    setTallaType('standard');
                }

                setFormData({
                    nombre: productData.nombre || '',
                    descripcion: productData.descripcion || '',
                    precio: productData.precio || '',
                    precioOferta: productData.precioOferta || '',
                    categoriaPrincipal: productData.categoriaPrincipal || '',
                    subcategoria: productData.subcategoria || '',
                    marca: productData.marca || '',
                    condicion: productData.condicion || '',
                    genero: productData.genero || '',
                    estilo: productData.estilo || '',
                    otroEstilo: productData.estilo && !styles.includes(productData.estilo) ? productData.estilo : '',
                    material: productData.material || '',
                    otroMaterial: productData.material && !materials.includes(productData.material) ? productData.material : '',
                    otrosDetalles: productData.otrosDetalles || '',
                    stock: productData.stock || 1,
                    tallas: isCustomTallaSaved ? [] : savedTallas,
                });
                setExistingImageUrls(productData.imageUrls || []);

            } else {
                toast.error("Producto no encontrado.");
                router.push('/app/pages/Profile_Ventas');
            }
        } catch (error) {
            toast.error("Error al cargar el producto.");
            console.error("Error al cargar producto:", error);
        } finally {
            setLoading(false);
        }
    }, [productId, user, router]);

    useEffect(() => {
        fetchProductData();
    }, [fetchProductData]);

    // --- Manejadores de cambios en el formulario ---
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

    const handleTallaTypeChange = (type) => {
        setTallaType(type);
        if (type === 'standard') {
            setCustomTalla('');
        } else { // 'custom'
            setFormData(prev => ({ ...prev, tallas: [] }));
        }
    };

    const handleImageRemove = (urlToRemove) => {
        setExistingImageUrls(prev => prev.filter(url => url !== urlToRemove));
        setImagesToDelete(prev => [...prev, urlToRemove]);
    };

    // --- Manejador de envío del formulario ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- VALIDACIONES ---
        const trimmedNombre = formData.nombre.trim();
        const trimmedDescripcion = formData.descripcion.trim();
        const trimmedPrecio = String(formData.precio).trim();
        const trimmedPrecioOferta = String(formData.precioOferta).trim();

        const commonFieldsValid = trimmedNombre && trimmedDescripcion && trimmedPrecio &&
                                    formData.categoriaPrincipal && formData.subcategoria &&
                                    formData.marca && formData.condicion &&
                                    formData.stock >= 1;

        const finalEstilo = formData.estilo === 'Otro' ? formData.otroEstilo.trim() : formData.estilo;
        const finalMaterial = formData.material === 'Otro' ? formData.otroMaterial.trim() : formData.material;

        const customFieldsAreValid =
            (formData.estilo === 'Otro' ? formData.otroEstilo.trim() !== '' : true) &&
            (formData.material === 'Otro' ? formData.otroMaterial.trim() !== '' : true);

        const clothingFieldsValid = !isElectronicProduct
            ? (formData.genero && ((tallaType === 'standard' && formData.tallas.length > 0) || (tallaType === 'custom' && customTalla.trim() !== '')) && customFieldsAreValid)
            : true;

        if (!commonFieldsValid || !clothingFieldsValid) {
            toast.error('Por favor, completa todos los campos obligatorios (*).');
            return;
        }
        if (trimmedPrecioOferta && parseFloat(trimmedPrecioOferta) >= parseFloat(trimmedPrecio)) {
            toast.error('El precio de oferta debe ser menor que el original.');
            return;
        }
        // Calcular el número total de imágenes después de los cambios
        const totalImagesAfterEdit = existingImageUrls.length + files.length - imagesToDelete.length;

        if (totalImagesAfterEdit === 0) {
            toast.error('Debes tener al menos 1 imagen.');
            return;
        }
        if (totalImagesAfterEdit > 4) {
            toast.error('Puedes tener un máximo de 4 imágenes.');
            return;
        }
        if (!user) {
            toast.error('Debes iniciar sesión para editar.');
            router.push('/login');
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Actualizando tu artículo...');

        try {
            // *** AQUI: Obtener el token de autenticación del usuario ***
            const idToken = await user.getIdToken();
            if (!idToken) {
                throw new Error("No se pudo obtener el token de autenticación. Intenta recargar la página.");
            }

            // Prepara los datos para enviar al backend
            const productDataForApi = {
                ...formData,
                nombre: trimmedNombre,
                descripcion: trimmedDescripcion,
                precio: parseFloat(trimmedPrecio),
                precioOferta: trimmedPrecioOferta ? parseFloat(trimmedPrecioOferta) : null,
                stock: parseInt(formData.stock, 10),
                estilo: finalEstilo,
                material: finalMaterial,
                tallas: tallaType === 'standard' ? formData.tallas : [customTalla.trim()],
                genero: !isElectronicProduct && formData.genero ? formData.genero : null,
                otrosDetalles: formData.otrosDetalles.trim() || null,
                otroEstilo: undefined,
                otroMaterial: undefined,
            };

            for (const key in productDataForApi) {
                if (productDataForApi[key] === '' || productDataForApi[key] === null || productDataForApi[key] === undefined) {
                    delete productDataForApi[key];
                }
            }
            if (!isElectronicProduct && (!productDataForApi.tallas || productDataForApi.tallas.length === 0)) {
                toast.error('Debes especificar al menos una talla para productos de ropa.');
                setIsSubmitting(false);
                toast.dismiss(loadingToast);
                return;
            }

            const sendFormData = new FormData();
            sendFormData.append('data', JSON.stringify(productDataForApi));

            files.forEach(file => sendFormData.append('newImages', file));
            sendFormData.append('existingImageUrls', JSON.stringify(existingImageUrls));
            sendFormData.append('imagesToDelete', JSON.stringify(imagesToDelete));

            const response = await fetch(`/api/productos/${productId}`, {
                method: 'PUT',
                // *** AGREGAR LOS HEADERS DE AUTORIZACIÓN AQUÍ ***
                headers: {
                    'Authorization': `Bearer ${idToken}` // Envía el token en el formato estándar
                },
                body: sendFormData
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Ocurrió un error al actualizar el producto.');
            }
            toast.success('¡Artículo actualizado con éxito!', { id: loadingToast });
            router.push('/app/pages/Profile_Ventas');

        } catch (error) {
            console.error("Error al actualizar producto:", error);
            toast.error(error.message, { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Si está cargando o formData aún no se ha inicializado
    if (loading || (!formData.nombre && !loading)) { // Comprobación adicional para evitar renderizado antes de cargar data
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
            <Toaster position="bottom-right" />
            <div className="max-w-4xl mx-auto">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 mb-6 transition-colors">
                    <ArrowLeft size={20} /> Volver
                </button>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Editar Producto</h1>
                    <form onSubmit={handleSubmit} className="space-y-10">

                        {/* SECCIÓN 1: INFORMACIÓN DEL PRODUCTO */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-500 pb-2">1. Información del Artículo</h2>
                            <div>
                                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Producto *</label>
                                <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                            <div>
                                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción *</label>
                                <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleFormChange} rows="4" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500" required></textarea>
                            </div>
                        </div>

                        {/* SECCIÓN 2: CATEGORÍAS Y DETALLES */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-500 pb-2">2. Categorías y Detalles</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="categoriaPrincipal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría Principal *</label>
                                    <select id="categoriaPrincipal" name="categoriaPrincipal" value={formData.categoriaPrincipal} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500" required>
                                        <option value="" disabled>Selecciona una categoría...</option>
                                        {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="subcategoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subcategoría *</label>
                                    <select id="subcategoria" name="subcategoria" value={formData.subcategoria} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500" disabled={!formData.categoriaPrincipal} required>
                                        <option value="" disabled>Selecciona...</option>
                                        {subcategoriasDisponibles.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marca *</label>
                                    <ComboBox
                                        // Asegúrate de que las opciones se mapeen a { value: item, label: item }
                                        options={marcasDisponibles.map(brand => ({ value: brand, label: brand }))}
                                        value={formData.marca}
                                        onChange={(val) => setFormData(prev => ({ ...prev, marca: val }))}
                                        placeholder={!formData.categoriaPrincipal ? "Selecciona una categoría primero" : "Busca o escribe una marca..."}
                                        disabled={!formData.categoriaPrincipal}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="condicion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condición del Artículo *</label>
                                    <select id="condicion" name="condicion" value={formData.condicion} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500" required>
                                        <option value="" disabled>Selecciona la condición...</option>
                                        {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 3: FILTROS ESPECÍFICOS (SI NO ES ELECTRÓNICO) */}
                        {!isElectronicProduct && formData.categoriaPrincipal && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-500 pb-2">3. Filtros Específicos</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="genero" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Género *</label>
                                        <select id="genero" name="genero" value={formData.genero} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500" required={!isElectronicProduct}>
                                            <option value="" disabled>Selecciona...</option>
                                            {genders.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="estilo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estilo</label>
                                        <select id="estilo" name="estilo" value={formData.estilo} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">No especificar</option>
                                            {styles.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    {formData.estilo === 'Otro' && (
                                        <div className="md:col-span-2">
                                            <label htmlFor="otroEstilo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especifica el estilo *</label>
                                            <input type="text" id="otroEstilo" name="otroEstilo" value={formData.otroEstilo} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: Gótico, Cyberpunk, etc." required />
                                        </div>
                                    )}
                                    <div className="md:col-span-2">
                                        <label htmlFor="material" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Material Principal</label>
                                        <select id="material" name="material" value={formData.material} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">No especificar</option>
                                            {materials.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    {formData.material === 'Otro' && (
                                        <div className="md:col-span-2">
                                            <label htmlFor="otroMaterial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especifica el material *</label>
                                            <input type="text" id="otroMaterial" name="otroMaterial" value={formData.otroMaterial} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: Bambú, Spandex, etc." required />
                                        </div>
                                    )}
                                </div>

                                {/* Sistema de Tallas */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-6 mb-2">Tallas Disponibles *</label>
                                    <div className="flex items-center gap-4 mb-4">
                                        <button type="button" onClick={() => handleTallaTypeChange('standard')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tallaType === 'standard' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>Tallas Estándar</button>
                                        <button type="button" onClick={() => handleTallaTypeChange('custom')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tallaType === 'custom' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>Talla Personalizada / Única</button>
                                    </div>
                                    {tallaType === 'standard' && (
                                        <div className="flex flex-wrap gap-x-6 gap-y-3 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                            {standardSizes.map(talla => (
                                                <label key={talla} className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" value={talla} checked={formData.tallas.includes(talla)} onChange={handleTallaChange} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800" />
                                                    <span className="text-gray-800 dark:text-gray-200 font-medium">{talla}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {tallaType === 'custom' && (
                                        <div className="relative">
                                            <Tag className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                value={customTalla}
                                                onChange={(e) => setCustomTalla(e.target.value)}
                                                className="w-full p-3 pl-10 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 border border-gray-200 dark:border-gray-700"
                                                placeholder="Ej: Talla Única, 42, Ajustable..."
                                                required={tallaType === 'custom'}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SECCIÓN 4: PRECIO Y STOCK */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-500 pb-2">{isElectronicProduct ? '3.' : '4.'} Precio y Stock</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad en Stock *</label>
                                    <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500" min="1" required />
                                </div>
                                <div>
                                    <label htmlFor="precio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio (en Bs.) *</label>
                                    <input type="number" id="precio" name="precio" value={formData.precio} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: 150.00" step="0.01" min="0" required />
                                </div>
                                <div>
                                    <label htmlFor="precioOferta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio de Oferta (Opcional)</label>
                                    <input type="number" id="precioOferta" name="precioOferta" value={formData.precioOferta} onChange={handleFormChange} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: 99.99" step="0.01" min="0" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="otrosDetalles" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Otros Detalles (Opcional)</label>
                                <textarea id="otrosDetalles" name="otrosDetalles" value={formData.otrosDetalles} onChange={handleFormChange} rows="3" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Añade información extra (ej: 'incluye cargador original', 'pequeño detalle en la manga', etc.)"></textarea>
                            </div>
                        </div>

                        {/* SECCIÓN 5: IMÁGENES */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-500 pb-2">{isElectronicProduct ? '4.' : '5.'} Imágenes del Artículo *</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Puedes tener un total de 1 a 4 imágenes. La primera será la portada.</p>

                            {/* Mostrar imágenes existentes */}
                            {existingImageUrls.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {existingImageUrls.map((url, index) => (
                                        <div key={url} className="relative group rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                                            <img src={url} alt={`Imagen de producto ${index + 1}`} className="w-full h-28 object-cover rounded-lg" />
                                            <button
                                                type="button"
                                                onClick={() => handleImageRemove(url)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm w-6 h-6"
                                                title="Eliminar imagen"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            {index === 0 && (
                                                <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full shadow-lg">Portada</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Mensaje si no hay imágenes (existentes ni nuevas seleccionadas) */}
                            {existingImageUrls.length === 0 && files.length === 0 && (
                                <div className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400">
                                    <ImageIcon size={48} className="mb-2" />
                                    <p className="text-center">No hay imágenes existentes. Sube nuevas imágenes.</p>
                                </div>
                            )}

                            {/* Uploader para nuevas imágenes */}
                            <ImageUploader
                                files={files}
                                setFiles={setFiles}
                                maxFiles={4 - existingImageUrls.length + imagesToDelete.length}
                            />
                        </div>

                        {/* BOTÓN DE ENVÍO */}
                        <div className="pt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                                <span className="text-lg">{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
