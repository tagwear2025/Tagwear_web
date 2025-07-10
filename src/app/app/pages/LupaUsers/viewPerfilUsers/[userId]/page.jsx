'use client';

// --- Importaciones ---
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
// ✅ Se añade el ícono 'Phone'
import { Loader, Star, Send, Trash2, MessageCircle, ShoppingBag, ShieldCheck, Tag, Phone } from 'lucide-react';
import Swal from 'sweetalert2';

// --- Componentes Reutilizables (sin cambios) ---
const StarRatingInput = ({ rating, setRating }) => (
    <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`cursor-pointer transition-all duration-150 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'}`}
                size={32}
                onClick={() => setRating(star)}
            />
        ))}
    </div>
);

const DisplayRating = ({ rating, count }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} className={`${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-500'}`} />
        ))}
        <span className="ml-2 text-sm font-bold text-gray-700 dark:text-gray-300">{rating.toFixed(1)}</span>
        {count !== undefined && <span className="ml-1.5 text-sm text-gray-500 dark:text-gray-400">({count})</span>}
    </div>
);

const ProductCard = ({ product }) => {
    const imageUrl = product.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls[0]
        : `https://placehold.co/600x400/e2e8f0/64748b?text=No+Imagen`;

    return (
        <Link href={`/app/productos/${product.id}`} passHref>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden group transform hover:-translate-y-1.5 transition-all duration-300 hover:shadow-xl">
                <div className="relative h-56">
                    <img src={imageUrl} alt={product.nombre} className="w-full h-full object-cover" />
                    <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white text-xs font-bold px-3 py-1 m-2 rounded-full">
                        {product.categoria}
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="font-bold text-lg truncate text-gray-900 dark:text-white" title={product.nombre}>{product.nombre}</h3>
                    <p className="text-blue-500 dark:text-blue-400 font-semibold text-2xl mt-2 flex items-center gap-2">
                        <Tag size={20} />
                        {parseFloat(product.precio).toFixed(2)} Bs.
                    </p>
                </div>
            </div>
        </Link>
    );
};


// --- Componente Principal de la Página ---
export default function ViewUserProfilePage() {
    const { user: currentUser } = useAuth();
    const { userId } = useParams();

    const [seller, setSeller] = useState(null);
    const [products, setProducts] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);

        const sellerRef = doc(db, 'users', userId);
        const unsubscribeSeller = onSnapshot(sellerRef, (docSnap) => {
            if (docSnap.exists()) {
                setSeller({ id: docSnap.id, ...docSnap.data() });
            } else {
                console.error("Vendedor no encontrado");
                setSeller(null);
            }
        });

        const productsQuery = query(collection(db, 'products'), where('userId', '==', userId));
        const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
            const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productList);
        });

        const ratingsQuery = query(collection(db, `users/${userId}/ratings`), orderBy('createdAt', 'desc'));
        const unsubscribeRatings = onSnapshot(ratingsQuery, (snapshot) => {
            const ratingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRatings(ratingsData);
            setLoading(false);
        });

        return () => {
            unsubscribeSeller();
            unsubscribeProducts();
            unsubscribeRatings();
        };
    }, [userId]);

    const averageRating = useMemo(() => {
        if (ratings.length === 0) return 0;
        return ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length;
    }, [ratings]);

    const hasUserCommented = useMemo(() => {
        if (!currentUser) return true;
        return ratings.some(r => r.reviewerId === currentUser.uid);
    }, [ratings, currentUser]);

    // --- Funciones de manejo de comentarios (sin cambios) ---
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (newRating === 0 || !newComment.trim()) {
            Swal.fire('Datos incompletos', 'Debes seleccionar una calificación y escribir un comentario.', 'warning');
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, `users/${userId}/ratings`), {
                rating: newRating,
                comment: newComment,
                reviewerId: currentUser.uid,
                reviewerName: currentUser.displayName || 'Anónimo',
                reviewerPhotoURL: currentUser.photoURL || '',
                createdAt: serverTimestamp(),
            });
            setNewComment(''); setNewRating(0);
            Swal.fire('¡Gracias!', 'Tu calificación ha sido publicada.', 'success');
        } catch (error) {
            console.error("Error al publicar la calificación:", error);
            Swal.fire('Error', 'No se pudo publicar tu calificación.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCommentDelete = async (ratingId) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?', text: "No podrás revertir esta acción.", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, ¡bórralo!', cancelButtonText: 'Cancelar'
        });
        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, `users/${userId}/ratings`, ratingId));
                Swal.fire('Eliminado', 'Tu comentario ha sido eliminado.', 'success');
            } catch (error) {
                console.error("Error al eliminar la calificación:", error);
                Swal.fire('Error', 'No se pudo eliminar tu comentario.', 'error');
            }
        }
    };

    // --- Renderizado del Componente ---
    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900"><Loader className="animate-spin text-blue-500" size={48} /></div>;
    }
    if (!seller) {
        return <div className="text-center mt-20 text-2xl font-bold text-gray-700 dark:text-gray-300">Vendedor no encontrado.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Cabecera del Perfil */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg mb-8 flex flex-col md:flex-row items-center gap-8">
                    <img src={seller.photoURL || `https://ui-avatars.com/api/?name=${seller.nombres}+${seller.apellidos}&background=random`} alt="Foto de perfil" className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-blue-500" />
                    <div className="text-center md:text-left flex-grow">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{seller.nombres} {seller.apellidos}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{seller.email}</p>
                        <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                            {seller.isSellerVerified && <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full dark:bg-green-900 dark:text-green-300"><ShieldCheck size={14} /> Vendedor Verificado</span>}
                            <DisplayRating rating={averageRating} count={ratings.length} />
                        </div>
                    </div>
                    {/* ✅ BOTÓN DE WHATSAPP AÑADIDO */}
                    {seller.telefono && (
                        <a 
                            href={`https://wa.me/591${seller.telefono}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-shrink-0 mt-6 md:mt-0 flex items-center justify-center gap-3 w-full md:w-auto px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-all transform hover:scale-105"
                        >
                            <Phone size={20} />
                            Contactar por WhatsApp
                        </a>
                    )}
                </div>

                {/* Grid principal para productos y calificaciones */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-gray-900 dark:text-white"><ShoppingBag /> Productos del Vendedor</h2>
                        {products.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {products.map(product => <ProductCard key={product.id} product={product} />)}
                            </div>
                        ) : (
                            <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-2xl shadow-inner">
                                <p className="text-gray-500 dark:text-gray-400 text-lg">Este vendedor aún no tiene productos publicados.</p>
                            </div>
                        )}
                    </div>

                    <div className="sticky top-8">
                        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-gray-900 dark:text-white"><MessageCircle /> Calificaciones</h2>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                            {currentUser && currentUser.uid !== userId && !hasUserCommented && (
                                <form onSubmit={handleCommentSubmit} className="mb-8 border-b dark:border-gray-700 pb-6">
                                    <h3 className="font-bold mb-4 text-gray-800 dark:text-gray-200">Deja tu calificación</h3>
                                    <StarRatingInput rating={newRating} setRating={setNewRating} />
                                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escribe tu comentario aquí..." className="w-full mt-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500" rows="3"></textarea>
                                    <button type="submit" disabled={isSubmitting} className="w-full mt-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2 transition-colors">
                                        {isSubmitting ? <Loader className="animate-spin" size={20}/> : <Send size={18}/>}
                                        {isSubmitting ? 'Publicando...' : 'Publicar'}
                                    </button>
                                </form>
                            )}
                            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                                {ratings.length > 0 ? ratings.map(r => (
                                    <div key={r.id} className="flex items-start gap-4">
                                        <img src={r.reviewerPhotoURL || `https://ui-avatars.com/api/?name=${r.reviewerName}`} alt={r.reviewerName} className="w-10 h-10 rounded-full" />
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{r.reviewerName}</p>
                                                    <DisplayRating rating={r.rating} />
                                                </div>
                                                {currentUser && r.reviewerId === currentUser.uid && (
                                                    <button onClick={() => handleCommentDelete(r.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                                )}
                                            </div>
                                            <p className="mt-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg whitespace-pre-wrap">{r.comment}</p>
                                        </div>
                                    </div>
                                )) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">Este vendedor aún no tiene calificaciones.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
