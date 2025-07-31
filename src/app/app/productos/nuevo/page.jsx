'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ImageUploader from '@/app/components/productos/ImageUploader';
import ComboBox from '@/components/ui/ComboBox';
import { toast, Toaster } from 'react-hot-toast';
import { Loader2, Upload, Tag } from 'lucide-react';

import {
    categories,
    clothingBrands,
    electronicBrands,
    styles,
    genders,
    conditions,
    materials,
    standardSizes
} from '@/data/productData.js';

export default function NuevoProductoPage() {
    const { user } = useAuth();
    const router = useRouter();

    // --- ESTADOS DEL FORMULARIO ---
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [marca, setMarca] = useState('');
    const [precio, setPrecio] = useState('');
    const [precioOferta, setPrecioOferta] = useState('');
    const [categoriaPrincipal, setCategoriaPrincipal] = useState('');
    const [subcategoria, setSubcategoria] = useState('');
    const [subcategoriasDisponibles, setSubcategoriasDisponibles] = useState([]);
    const [marcasDisponibles, setMarcasDisponibles] = useState([]);
    const [genero, setGenero] = useState('');
    const [condicion, setCondicion] = useState('');
    const [otrosDetalles, setOtrosDetalles] = useState('');
    const [stock, setStock] = useState(1);
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Estados para campos opcionales y personalizados
    const [estilo, setEstilo] = useState('');
    const [otroEstilo, setOtroEstilo] = useState('');
    const [material, setMaterial] = useState('');
    const [otroMaterial, setOtroMaterial] = useState('');

    // Estados para tallas
    const [tallaType, setTallaType] = useState('standard');
    const [tallas, setTallas] = useState([]);
    const [customTalla, setCustomTalla] = useState('');

    const isElectronicProduct = categoriaPrincipal === 'Electrónicos 🔌';

    // --- EFECTOS ---
    useEffect(() => {
        if (categoriaPrincipal) {
            setSubcategoriasDisponibles(categories[categoriaPrincipal] || []);
            setMarcasDisponibles(isElectronicProduct ? electronicBrands : clothingBrands);
            setSubcategoria('');
            setMarca('');
            setEstilo('');
            setOtroEstilo('');
            setMaterial('');
            setOtroMaterial('');
            // Si la categoría cambia y ya no es electrónica, reinicia genero y tallas por si acaso
            if (isElectronicProduct) {
                setGenero('');
                setTallas([]);
                setCustomTalla('');
                setTallaType('standard');
            }
        } else {
            setSubcategoriasDisponibles([]);
            setMarcasDisponibles([]);
        }
    }, [categoriaPrincipal, isElectronicProduct]);

    // --- MANEJADORES ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- VALIDACIONES MEJORADAS Y CORREGIDAS ---
        // Asegúrate de trim() los campos de texto obligatorios para que no pasen solo con espacios
        const trimmedNombre = nombre.trim();
        const trimmedDescripcion = descripcion.trim();
        const trimmedPrecio = precio.trim();
        const trimmedPrecioOferta = precioOferta.trim();

        const commonFieldsValid = trimmedNombre && trimmedDescripcion && trimmedPrecio && categoriaPrincipal && subcategoria && marca && condicion && files.length > 0 && stock >= 1;

        // Valida campos de "Otro" si fueron seleccionados
        const customFieldsAreValid =
            (estilo === 'Otro' ? otroEstilo.trim() !== '' : true) &&
            (material === 'Otro' ? otroMaterial.trim() !== '' : true);

        // Valida campos de Ropa
        const clothingFieldsValid = !isElectronicProduct
            ? (genero && ((tallaType === 'standard' && tallas.length > 0) || (tallaType === 'custom' && customTalla.trim() !== '')) && customFieldsAreValid)
            : true;

        if (!commonFieldsValid || !clothingFieldsValid) {
            toast.error('Por favor, completa todos los campos obligatorios (*).');
            return;
        }

        if (trimmedPrecioOferta && parseFloat(trimmedPrecioOferta) >= parseFloat(trimmedPrecio)) {
            toast.error('El precio de oferta debe ser menor que el original.');
            return;
        }
        if (files.length > 4) {
            toast.error('Puedes subir un máximo de 4 imágenes.');
            return;
        }
        if (!user) {
            toast.error('Debes iniciar sesión para publicar.');
            router.push('/login');
            return;
        }

        setIsLoading(true);
        const loadingToast = toast.loading('Publicando tu artículo...');

        const formData = new FormData();

        // --- AÑADIR DATOS AL FORMDATA (CORREGIDO Y CONDICIONAL) ---
        formData.append('nombre', trimmedNombre);
        formData.append('descripcion', trimmedDescripcion);
        formData.append('precio', trimmedPrecio);
        if (trimmedPrecioOferta) formData.append('precioOferta', trimmedPrecioOferta);
        formData.append('marca', marca);
        formData.append('categoriaPrincipal', categoriaPrincipal);
        formData.append('subcategoria', subcategoria);
        formData.append('condicion', condicion);
        if (otrosDetalles.trim()) formData.append('otrosDetalles', otrosDetalles.trim()); // Trim and conditionally append
        formData.append('stock', stock);
        formData.append('userId', user.uid);
        formData.append('vendedorNombre', user.displayName || user.email);

        if (!isElectronicProduct) {
            formData.append('genero', genero); // Género es requerido para no electrónicos

            // Estilo: Solo se añade si hay un valor válido
            const finalEstilo = estilo === 'Otro' ? otroEstilo.trim() : estilo;
            if (finalEstilo) {
                formData.append('estilo', finalEstilo);
            }

            // Material: Solo se añade si hay un valor válido
            const finalMaterial = material === 'Otro' ? otroMaterial.trim() : material;
            if (finalMaterial) {
                formData.append('material', finalMaterial);
            }

            // Tallas: Solo se añade si hay tallas seleccionadas o una talla personalizada no vacía
            let finalTallasArray = [];
            if (tallaType === 'standard' && tallas.length > 0) {
                finalTallasArray = tallas;
            } else if (tallaType === 'custom' && customTalla.trim() !== '') {
                finalTallasArray = [customTalla.trim()];
            }

            if (finalTallasArray.length > 0) {
                formData.append('tallas', JSON.stringify(finalTallasArray));
            }
        }

        files.forEach(file => formData.append('images', file));

        try {
            const response = await fetch('/api/productos', { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) {
                // Lanza el error que viene del backend para que sea más específico
                throw new Error(result.error || 'Ocurrió un error al subir el producto.');
            }
            toast.success('¡Artículo publicado con éxito!', { id: loadingToast });
            router.push('/app/pages/Profile_Ventas');
        } catch (error) {
            console.error("Error al subir producto:", error);
            toast.error(error.message, { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    // --- RENDERIZADO DEL COMPONENTE (JSX sin cambios significativos) ---
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
            <Toaster position="bottom-right" />
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Vende tu Artículo</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-8">Completa los detalles para que tu producto destaque. Los campos con * son obligatorios.</p>

                <form onSubmit={handleSubmit} className="space-y-10">

                    {/* SECCIÓN 1: INFORMACIÓN DEL PRODUCTO */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-500 pb-2">1. Información del Artículo</h2>
                        <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Producto *</label>
                            <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" placeholder="Ej: Hoodie oversize negro, iPhone 14 Pro" required />
                        </div>
                        <div>
                            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción *</label>
                            <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows="4" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" placeholder="Describe los detalles, estado, características, etc." required></textarea>
                        </div>
                    </div>

                    {/* SECCIÓN 2: CATEGORÍAS Y DETALLES */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-500 pb-2">2. Categorías y Detalles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="categoriaPrincipal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría Principal *</label>
                                <select id="categoriaPrincipal" value={categoriaPrincipal} onChange={(e) => setCategoriaPrincipal(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" required>
                                    <option value="" disabled>Selecciona una categoría...</option>
                                    {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="subcategoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subcategoría *</label>
                                <select id="subcategoria" value={subcategoria} onChange={(e) => setSubcategoria(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" disabled={!categoriaPrincipal} required>
                                    <option value="" disabled>Selecciona...</option>
                                    {subcategoriasDisponibles.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marca *</label>
                                <ComboBox options={marcasDisponibles} value={marca} onChange={setMarca} placeholder={!categoriaPrincipal ? "Selecciona una categoría primero" : "Busca o escribe una marca..."} disabled={!categoriaPrincipal} />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="condicion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condición del Artículo *</label>
                                <select id="condicion" value={condicion} onChange={(e) => setCondicion(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" required>
                                    <option value="" disabled>Selecciona la condición...</option>
                                    {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: FILTROS ESPECÍFICOS (SI NO ES ELECTRÓNICO) */}
                    {!isElectronicProduct && categoriaPrincipal && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-500 pb-2">3. Filtros Específicos</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="genero" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Género *</label>
                                    <select id="genero" value={genero} onChange={(e) => setGenero(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" required={!isElectronicProduct}>
                                        <option value="" disabled>Selecciona...</option>
                                        {genders.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="estilo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estilo</label>
                                    <select id="estilo" value={estilo} onChange={(e) => setEstilo(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <option value="">No especificar</option>
                                        {styles.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                {estilo === 'Otro' && (
                                    <div className="md:col-span-2">
                                        <label htmlFor="otroEstilo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especifica el estilo *</label>
                                        <input type="text" id="otroEstilo" value={otroEstilo} onChange={(e) => setOtroEstilo(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" placeholder="Ej: Gótico, Cyberpunk, etc." required />
                                    </div>
                                )}
                                <div className="md:col-span-2">
                                    <label htmlFor="material" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Material Principal</label>
                                    <select id="material" value={material} onChange={(e) => setMaterial(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <option value="">No especificar</option>
                                        {materials.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                {material === 'Otro' && (
                                    <div className="md:col-span-2">
                                        <label htmlFor="otroMaterial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especifica el material *</label>
                                        <input type="text" id="otroMaterial" value={otroMaterial} onChange={(e) => setOtroMaterial(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" placeholder="Ej: Bambú, Spandex, etc." required />
                                    </div>
                                )}
                            </div>

                            {/* Sistema de Tallas */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-6 mb-2">Tallas Disponibles *</label>
                                <div className="flex items-center gap-4 mb-4">
                                    <button type="button" onClick={() => setTallaType('standard')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tallaType === 'standard' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>Tallas Estándar</button>
                                    <button type="button" onClick={() => setTallaType('custom')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tallaType === 'custom' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>Talla Personalizada / Única</button>
                                </div>
                                {tallaType === 'standard' && (
                                    <div className="flex flex-wrap gap-x-6 gap-y-3 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                        {standardSizes.map(talla => (
                                            <label key={talla} className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" value={talla} onChange={(e) => { const { value, checked } = e.target; setTallas(prev => checked ? [...prev, value] : prev.filter(t => t !== value)); }} checked={tallas.includes(talla)} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500" />
                                                <span className="text-gray-800 dark:text-gray-200 font-medium">{talla}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {tallaType === 'custom' && (
                                    <div className="relative">
                                        <Tag className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="text" value={customTalla} onChange={(e) => setCustomTalla(e.target.value)} className="w-full p-3 pl-10 bg-gray-100 dark:bg-gray-700 rounded-lg" placeholder="Ej: Talla Única, 42, Ajustable..." />
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
                                <input type="number" id="stock" value={stock} onChange={(e) => setStock(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" min="1" />
                            </div>
                            <div>
                                <label htmlFor="precio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio (en Bs.) *</label>
                                <input type="number" id="precio" value={precio} onChange={(e) => setPrecio(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" placeholder="Ej: 150.00" step="0.01" min="0" required />
                            </div>
                            <div>
                                <label htmlFor="precioOferta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio de Oferta (Opcional)</label>
                                <input type="number" id="precioOferta" value={precioOferta} onChange={(e) => setPrecioOferta(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" placeholder="Ej: 99.99" step="0.01" min="0" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="otrosDetalles" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Otros Detalles (Opcional)</label>
                            <textarea id="otrosDetalles" value={otrosDetalles} onChange={(e) => setOtrosDetalles(e.target.value)} rows="3" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" placeholder="Añade información extra (ej: 'incluye cargador original', 'pequeño detalle en la manga', etc.)"></textarea>
                        </div>
                    </div>

                    {/* SECCIÓN 5: IMÁGENES */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-500 pb-2">{isElectronicProduct ? '4.' : '5.'} Imágenes del Artículo *</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sube entre 1 y 4 imágenes. La primera será la portada.</p>
                        <ImageUploader files={files} setFiles={setFiles} maxFiles={4} />
                    </div>

                    {/* BOTÓN DE ENVÍO */}
                    <div className="pt-6 flex justify-end">
                        <button type="submit" disabled={isLoading || !categoriaPrincipal} className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
                            <span className="text-lg">{isLoading ? 'Publicando...' : 'Publicar Artículo'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
