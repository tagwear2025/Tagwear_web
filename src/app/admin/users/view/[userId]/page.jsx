'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader, User, Mail, Calendar, Users, MapPin, Phone, Star, MessageSquare, ArrowLeft, ShieldCheck, Camera, ShoppingBag, Send } from 'lucide-react';
import Swal from 'sweetalert2';

// --- Componente para INPUT de calificación con estrellas ---
const StarRatingInput = ({ rating, setRating }) => (
    <div className="flex items-center gap-1 my-2">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`cursor-pointer transition-all duration-150 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}
                size={24}
                onClick={() => setRating(star)}
            />
        ))}
    </div>
);

// --- Componente para MOSTRAR la calificación con estrellas ---
const DisplayRating = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} className={`${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
        ))}
        <span className="ml-2 text-sm font-bold text-white">{rating.toFixed(1)}</span>
    </div>
);

// --- Componente para mostrar un campo de información ---
const InfoField = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-gray-400">{icon}</div>
        <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="font-semibold text-white">{value || 'No especificado'}</p>
        </div>
    </div>
);

// --- Componente para mostrar las imágenes de verificación ---
const ImageDisplayCard = ({ title, imageUrl, icon }) => (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center text-center h-full">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">{icon}{title}</h3>
        {imageUrl ? (
            <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                <img 
                    src={imageUrl} 
                    alt={title} 
                    className="w-48 h-48 object-cover rounded-lg border-2 border-gray-600 hover:border-blue-500 transition-all"
                />
            </a>
        ) : (
            <div className="w-48 h-48 flex items-center justify-center bg-gray-700 rounded-lg border-2 border-dashed border-gray-600">
                <p className="text-gray-500">No disponible</p>
            </div>
        )}
    </div>
);

// --- Componente para mostrar las tarjetas de productos ---
const ProductCard = ({ product }) => {
    const imageUrl = product.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls[0]
        : `https://placehold.co/600x400/1f2937/fff?text=No+Imagen`;
    
    const hasOffer = product.precioOferta && parseFloat(product.precioOferta) > 0;

    return (
        <Link href={`/app/productos/${product.id}`} passHref target="_blank">
            <div className="bg-gray-700/50 rounded-xl overflow-hidden group transform hover:-translate-y-1.5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 h-full flex flex-col">
                <div className="relative h-48">
                    <img src={imageUrl} alt={product.nombre} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 flex-grow flex flex-col">
                    <h3 className="font-bold text-md truncate text-white" title={product.nombre}>{product.nombre}</h3>
                    <div className="mt-auto pt-2">
                        {hasOffer ? (
                            <div className="flex items-baseline gap-2">
                                <p className="text-blue-400 font-semibold text-xl">Bs. {parseFloat(product.precioOferta).toFixed(2)}</p>
                                <p className="text-gray-400 line-through text-sm">Bs. {parseFloat(product.precio).toFixed(2)}</p>
                            </div>
                        ) : (
                            <p className="text-blue-400 font-semibold text-xl">Bs. {parseFloat(product.precio).toFixed(2)}</p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};


export default function AdminViewUserProfile() {
    const { userId } = useParams();
    const router = useRouter();
    const { user: adminUser } = useAuth(); // Admin que está viendo la página
    const [user, setUser] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [products, setProducts] = useState([]);
    const [newAdminComment, setNewAdminComment] = useState(''); // Estado para el comentario del admin
    const [newAdminRating, setNewAdminRating] = useState(0); // Estado para la calificación del admin
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            setError("No se proporcionó un ID de usuario.");
            setLoading(false);
            return;
        }

        const userRef = doc(db, 'users', userId);
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                setUser({ id: docSnap.id, ...docSnap.data() });
            } else {
                setError("Usuario no encontrado.");
                setUser(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error al obtener usuario:", err);
            setError("Error al cargar los datos del usuario.");
            setLoading(false);
        });

        const ratingsQuery = query(collection(db, `users/${userId}/ratings`), orderBy('createdAt', 'desc'));
        const unsubscribeRatings = onSnapshot(ratingsQuery, (snapshot) => {
            const ratingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRatings(ratingsData);
        }, (err) => console.error("Error al obtener calificaciones:", err));

        const productsQuery = query(collection(db, 'products'), where('userId', '==', userId));
        const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productsData);
        }, (err) => console.error("Error al obtener productos:", err));

        return () => {
            unsubscribeUser();
            unsubscribeRatings();
            unsubscribeProducts();
        };
    }, [userId]);
    
    const averageRating = useMemo(() => {
        if (ratings.length === 0) return 0;
        return ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length;
    }, [ratings]);

    // Manejador para guardar el comentario PÚBLICO del admin
    const handleAdminCommentSubmit = async (e) => {
        e.preventDefault();
        if (newAdminRating === 0 || !newAdminComment.trim()) {
            Swal.fire({ title: 'Datos incompletos', text: 'Debes seleccionar una calificación y escribir un comentario.', icon: 'warning', background: '#1f2937', color: '#f9fafb' });
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, `users/${userId}/ratings`), {
                comment: newAdminComment,
                rating: newAdminRating,
                reviewerName: adminUser?.displayName || 'Administrador',
                reviewerId: adminUser?.uid,
                reviewerPhotoURL: adminUser?.photoURL || `https://ui-avatars.com/api/?name=Admin&background=1d4ed8&color=fff`,
                isAdminComment: true, // Campo clave para identificar el comentario
                createdAt: serverTimestamp(),
            });
            setNewAdminComment('');
            setNewAdminRating(0);
            Swal.fire({ title: '¡Éxito!', text: 'Tu comentario ha sido publicado.', icon: 'success', background: '#1f2937', color: '#f9fafb' });
        } catch (error) {
            console.error("Error al publicar comentario:", error);
            Swal.fire({ title: 'Error', text: 'No se pudo publicar el comentario.', icon: 'error', background: '#1f2937', color: '#f9fafb' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-900"><Loader className="animate-spin text-blue-500" size={48} /></div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (!user) {
        return <div className="p-8 text-center text-yellow-500">El usuario solicitado no existe.</div>;
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-900 min-h-screen text-gray-200">
            <div className="max-w-7xl mx-auto">
                <button onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    <ArrowLeft size={16} />
                    Volver a la lista
                </button>

                <header className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row items-center gap-6">
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.nombres}+${user.apellidos}&background=374151&color=fff`} alt="Foto de perfil" className="w-24 h-24 rounded-full object-cover border-4 border-gray-600" />
                    <div className="text-center md:text-left flex-grow">
                        <h1 className="text-3xl font-bold text-white">{user.nombres} {user.apellidos}</h1>
                        <p className="text-gray-400">{user.email}</p>
                        <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                            {user.isSellerVerified && <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded-full"><ShieldCheck size={14} /> Vendedor Verificado</span>}
                            <DisplayRating rating={averageRating} />
                             <span className="text-sm text-gray-400">({ratings.length} calificaciones)</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna de Contenido Principal */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><ShoppingBag className="text-blue-400"/> Productos Publicados</h2>
                            {products.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {products.map(product => <ProductCard key={product.id} product={product} />)}
                                </div>
                            ) : (
                                <div className="text-center py-12 px-6 border-2 border-dashed border-gray-700 rounded-lg">
                                    <p className="text-gray-400">Este usuario aún no tiene productos publicados.</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold text-white mb-4">Verificación de Vendedor</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ImageDisplayCard title="Foto de Perfil" imageUrl={user.photoURL} icon={<User size={20}/>} />
                                <ImageDisplayCard title="Selfie de Verificación" imageUrl={user.selfieURL} icon={<Camera size={20}/>} />
                            </div>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold text-white mb-6">Calificaciones Recibidas</h2>
                            
                            {/* Formulario para comentario del Admin */}
                            <form onSubmit={handleAdminCommentSubmit} className="mb-6 bg-gray-700/50 p-4 rounded-lg border border-blue-500">
                                <h3 className="font-bold text-white mb-2">Dejar un comentario como Administrador</h3>
                                <StarRatingInput rating={newAdminRating} setRating={setNewAdminRating} />
                                <textarea 
                                    value={newAdminComment}
                                    onChange={(e) => setNewAdminComment(e.target.value)}
                                    placeholder="Escribe un comentario público para este usuario..." 
                                    className="w-full p-3 bg-gray-700 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-white" 
                                    rows="3"
                                ></textarea>
                                <button type="submit" disabled={isSubmitting} className="w-full mt-3 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                                    {isSubmitting ? <Loader className="animate-spin" size={20}/> : <Send size={18}/>}
                                    {isSubmitting ? 'Publicando...' : 'Publicar Comentario'}
                                </button>
                            </form>
                            
                            {/* Lista de todas las calificaciones */}
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {ratings.length > 0 ? ratings.map(r => (
                                    <div key={r.id} className={`p-4 rounded-lg flex items-start gap-4 ${r.isAdminComment ? 'bg-blue-900/40 border border-blue-700' : 'bg-gray-700/50'}`}>
                                        <img src={r.reviewerPhotoURL || `https://ui-avatars.com/api/?name=${r.reviewerName}&background=4b5563&color=fff`} alt={r.reviewerName} className="w-10 h-10 rounded-full" />
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold text-white flex items-center gap-2">
                                                    {r.reviewerName}
                                                    {r.isAdminComment && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">Admin</span>}
                                                </p>
                                                <DisplayRating rating={r.rating} />
                                            </div>
                                            <p className="mt-2 text-gray-300 whitespace-pre-wrap">{r.comment}</p>
                                            <p className="text-xs text-gray-500 mt-2 text-right">
                                                {r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleString('es-ES') : 'Fecha no disponible'}
                                            </p>
                                        </div>
                                    </div>
                                )) : <p className="text-center text-gray-400 py-8">Este usuario aún no tiene calificaciones.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Columna Lateral con Datos Personales */}
                    <div className="lg:sticky top-8 self-start">
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold text-white mb-6">Datos Personales</h2>
                            <div className="space-y-5">
                                <InfoField icon={<User size={20} />} label="Nombre Completo" value={`${user.nombres} ${user.apellidos}`} />
                                <InfoField icon={<Mail size={20} />} label="Email" value={user.email} />
                                <InfoField icon={<Phone size={20} />} label="Teléfono (WhatsApp)" value={user.telefono} />
                                <InfoField icon={<Calendar size={20} />} label="Fecha de Nacimiento" value={user.fechaNacimiento} />
                                <InfoField icon={<Users size={20} />} label="Sexo" value={user.sexo} />
                                <InfoField icon={<MapPin size={20} />} label="Lugar de Residencia" value={user.lugarResidencia} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
