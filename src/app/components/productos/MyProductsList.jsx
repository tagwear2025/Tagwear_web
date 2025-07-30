// src/app/components/productos/MyProductsList.jsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, Edit, Trash2, Loader, Inbox } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

// Componente Switch para marcar como vendido (sin cambios)
const StatusToggle = ({ isAvailable, onChange }) => (
    <button onClick={onChange} className={`relative inline-flex items-center h-7 rounded-full w-28 transition-colors ${isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}>
        <span className={`absolute left-1 top-1/2 -translate-y-1/2 w-20 text-xs font-bold text-white transition-transform duration-300 ${isAvailable ? 'translate-x-0' : 'translate-x-6'}`}>
            {isAvailable ? 'Disponible' : 'Vendido'}
        </span>
        <span className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isAvailable ? 'translate-x-1' : 'translate-x-[4.75rem]'}`} />
    </button>
);

export default function MyProductsList({ user }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false); // Detener la carga si no hay usuario
            return;
        }

        const q = query(collection(db, 'products'), where('userId', '==', user.uid));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Ordenación del lado del cliente para evitar errores de índice en Firestore
            userProducts.sort((a, b) => {
                const dateA = a.fechaCreacion?.toDate() || 0; // Usar fechaCreacion
                const dateB = b.fechaCreacion?.toDate() || 0;
                return dateB - dateA; // Ordena de más nuevo a más antiguo
            });

            setProducts(userProducts);
            setLoading(false);
        }, (error) => {
            toast.error("No se pudieron cargar tus productos.");
            console.error("Error con onSnapshot:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    // Función sin cambios
    const handleToggleStatus = async (product) => {
        const newStatus = product.estado === 'disponible' ? 'vendido' : 'disponible';
        const productRef = doc(db, 'products', product.id);
        try {
            await updateDoc(productRef, { estado: newStatus });
            toast.success(`Producto marcado como ${newStatus}.`);
        } catch (error) {
            toast.error('No se pudo actualizar el estado.');
        }
    };
    
    // Función sin cambios
    const handleRequestPremium = async (product) => {
        if (product.isPremium) {
            toast.error('Este producto ya es premium.');
            return;
        }
        if (product.estado === 'vendido') {
            toast.error('No puedes hacer premium un producto vendido.');
            return;
        }

        const loadingToast = toast.loading('Verificando información...');

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists() || !userDocSnap.data().telefono) {
                toast.dismiss(loadingToast);
                Swal.fire({
                    icon: 'warning',
                    title: 'Falta tu número de teléfono',
                    html: 'Para continuar, por favor, añade tu número de WhatsApp en tu perfil. <br/>Puedes añadirlo en la sección de <strong>"Datos Personales"</strong>.',
                    confirmButtonText: 'Ir a mi Perfil',
                    showCancelButton: true,
                    cancelButtonText: 'Más tarde'
                }).then((result) => {
                    if (result.isConfirmed) {
                        router.push('/app/pages/Profile');
                    }
                });
                return;
            }
            const userData = userDocSnap.data();

            const configRef = doc(db, 'config', 'payment');
            const configSnap = await getDoc(configRef);
            if (!configSnap.exists() || !configSnap.data().qrImageUrl || !configSnap.data().adminWhatsapp) {
                toast.error('La información de pago no está configurada. Contacta al administrador.', { id: loadingToast });
                return;
            }
            
            const { qrImageUrl, adminWhatsapp } = configSnap.data();
            const whatsappLink = `https://wa.me/591${adminWhatsapp}?text=Hola, quiero hacer premium mi producto: "${product.nombre}". Adjunto mi comprobante de pago.`;
            
            toast.dismiss(loadingToast);

            const result = await Swal.fire({
                title: '<strong>Haz tu Producto Premium</strong>',
                icon: 'info',
                html: `
                    <div class="text-left space-y-4">
                        <p>Para destacar tu producto, realiza el pago y contacta al administrador.</p>
                        <div class="text-center">
                            <img src="${qrImageUrl}" alt="Código QR para pago" class="w-48 h-48 mx-auto border rounded-lg"/>
                            <p class="text-sm mt-2">Escanea el código QR para pagar.</p>
                        </div>
                        <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" class="block w-full text-center bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-all">
                            Contactar al Admin por WhatsApp
                        </a>
                        <p class="text-xs text-gray-500">Después de contactar al admin y confirmar el pago, haz clic en "Enviar Solicitud" para que tu producto sea aprobado.</p>
                    </div>
                `,
                showCloseButton: true,
                showCancelButton: true,
                focusConfirm: false,
                confirmButtonText: 'Hecho, ¡Enviar Solicitud!',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#3b82f6',
                cancelButtonColor: '#6b7280',
            });

            if (result.isConfirmed) {
                const finalLoadingToast = toast.loading('Enviando solicitud formal...');
                await addDoc(collection(db, 'solicitudesPremium'), {
                    userId: user.uid,
                    userName: user.displayName || user.email,
                    userPhone: userData.telefono,
                    productId: product.id,
                    productName: product.nombre,
                    status: 'pendiente',
                    fechaSolicitud: serverTimestamp()
                });
                toast.success('¡Solicitud enviada! El admin la revisará pronto.', { id: finalLoadingToast });
            }

        } catch (error) {
            toast.error('Ocurrió un error. Inténtalo de nuevo.', { id: loadingToast });
            console.error("Error in premium request process:", error);
        }
    };
    
    // --- ✅ FUNCIÓN DE ELIMINACIÓN CORREGIDA ---
    const handleDeleteProduct = async (product) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `¡No podrás revertir esto! Se eliminará "${product.nombre}" y todas sus imágenes.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const loadingToast = toast.loading('Eliminando producto...');
            try {
                // 1. Verificar que el usuario esté autenticado
                if (!user) {
                    throw new Error("Debes iniciar sesión para eliminar productos.");
                }

                // 2. Obtener el token de autenticación del usuario actual
                const token = await user.getIdToken(true); // true fuerza la actualización del token

                // 3. Realizar la solicitud a la API, incluyendo el token en el encabezado
                const response = await fetch(`/api/productos/${product.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                // 4. Manejar la respuesta de la API
                if (!response.ok) {
                    const errorData = await response.json();
                    // Lanza un error para ser capturado por el bloque catch
                    throw new Error(errorData.error || `Error ${response.status}: No se pudo eliminar.`);
                }
                
                // 5. Si la eliminación fue exitosa, mostrar mensaje de éxito.
                // onSnapshot se encargará de actualizar la UI automáticamente.
                toast.success('Producto eliminado con éxito.', { id: loadingToast });

            } catch (error) {
                console.error('Error al eliminar el producto:', error);
                toast.error(error.message || 'No se pudo eliminar el producto.', { id: loadingToast });
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center p-10"><Loader className="animate-spin text-blue-500" size={40} /></div>;
    if (products.length === 0) return <div className="text-center p-10 border-2 border-dashed rounded-lg"><Inbox size={48} className="mx-auto text-gray-400" /><h3 className="mt-4 text-xl font-semibold">No tienes productos</h3><p className="mt-2 text-sm text-gray-500">Añade tu primer artículo para empezar a vender.</p></div>;
    
    return (
        <div className="space-y-4">
            {products.map((product) => (
                <div key={product.id} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <div className="relative flex-shrink-0">
                        <Image src={product.imageUrls?.[0] || 'https://placehold.co/100x100/e0e0e0/7f7f7f?text=Producto'} alt={product.nombre} width={100} height={100} className="rounded-md object-cover w-24 h-24" />
                        {product.precioOferta && (
                            <div className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                                OFERTA
                            </div>
                        )}
                    </div>
                    <div className="flex-grow text-center md:text-left">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">{product.nombre}</h4>
                        
                        <div className="mt-1">
                            {product.precioOferta && parseFloat(product.precioOferta) > 0 ? (
                                <div className="flex items-baseline justify-center md:justify-start gap-2">
                                    <p className="text-red-500 dark:text-red-400 font-bold text-lg">Bs. {parseFloat(product.precioOferta).toFixed(2)}</p>
                                    <p className="text-gray-500 line-through text-sm">Bs. {parseFloat(product.precio).toFixed(2)}</p>
                                </div>
                            ) : (
                                <p className="text-blue-600 dark:text-blue-400 font-semibold text-lg">Bs. {parseFloat(product.precio).toFixed(2)}</p>
                            )}
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400">Stock: {product.stock || 0}</p>
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-4">
                        <StatusToggle isAvailable={product.estado === 'disponible'} onChange={() => handleToggleStatus(product)} />
                        <div className="flex items-center gap-2">
                            <button onClick={() => router.push(`/app/productos/edit/${product.id}`)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition" title="Editar Producto"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteProduct(product)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition" title="Eliminar Producto"><Trash2 size={18} /></button>
                        </div>
                        <button onClick={() => handleRequestPremium(product)} disabled={product.isPremium || product.estado === 'vendido'} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition" title="Solicitar Premium"><Star size={16}/><span>Premium</span></button>
                    </div>
                </div>
            ))}
        </div>
    );
}
