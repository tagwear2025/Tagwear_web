'use client';

// --- Importaciones (Lógica Intacta) ---
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Loader, Star, Bell, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Componente para una Notificación Individual (Estilos Renovados) ---
const NotificationItem = ({ notification }) => {
    // Notificación de nueva calificación
    if (notification.type === 'new_rating') {
        const { data } = notification;
        return (
            <Link href={`/app/pages/Profile#ratings-section`} className="block">
                <div className="flex items-start gap-4 p-4 bg-black/30 border border-white/10 rounded-2xl hover:bg-white/5 transition-colors duration-200">
                    <img 
                        src={data.reviewerPhotoURL || `https://ui-avatars.com/api/?name=${data.reviewerName}&background=222&color=fff`} 
                        alt={data.reviewerName} 
                        className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                        <p className="text-white/90">
                            <span className="font-bold text-white">{data.reviewerName}</span> te ha dejado una calificación.
                        </p>
                        <div className="flex items-center gap-1 my-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={16} className={`${i < data.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                            ))}
                        </div>
                        <blockquote className="text-sm text-white/70 italic bg-white/5 border-l-2 border-orange-500 p-2 rounded-md mt-2">
                            "{data.comment}"
                        </blockquote>
                        <p className="text-xs text-white/50 mt-2">
                            {formatDistanceToNow(data.createdAt.toDate(), { addSuffix: true, locale: es })}
                        </p>
                    </div>
                </div>
            </Link>
        );
    }

    // Notificación de producto premium activo
    if (notification.type === 'premium_active') {
        const { data } = notification;
        const imageUrl = data.imageUrls?.[0] || `https://placehold.co/600x400/111/fff?text=No+Imagen`;
        return (
            <Link href={`/app/productos/${notification.id}`} className="block">
                <div className="flex items-start gap-4 p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-lg hover:bg-orange-500/20 transition-colors duration-200">
                    <img 
                        src={imageUrl} 
                        alt={data.nombre} 
                        className="w-12 h-12 rounded-md object-cover"
                    />
                    <div className="flex-1">
                        <p className="font-bold text-orange-400">¡Tu producto es Premium!</p>
                        <p className="text-white/90">
                            El producto <span className="font-semibold">{data.nombre}</span> está destacado en la página de inicio.
                        </p>
                        <p className="text-xs text-white/60 font-semibold mt-2 flex items-center gap-1">
                            <Clock size={14} />
                            Válido hasta: {format(data.premiumHasta.toDate(), 'dd MMMM yyyy, HH:mm', { locale: es })}
                        </p>
                    </div>
                </div>
            </Link>
        );
    }

    return null;
};


// --- Componente Principal de la Página de Notificaciones (Lógica Intacta) ---
export default function NotificationsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        let activeListeners = 2;
        const handleLoading = () => {
            activeListeners--;
            if (activeListeners === 0) {
                setLoading(false);
            }
        };
        const ratingsQuery = query(
            collection(db, `users/${user.uid}/ratings`),
            orderBy('createdAt', 'desc')
        );
        const unsubscribeRatings = onSnapshot(ratingsQuery, (snapshot) => {
            const ratingNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                type: 'new_rating',
                timestamp: doc.data().createdAt,
                data: doc.data()
            }));
            setNotifications(prev => {
                const otherNotifications = prev.filter(n => n.type !== 'new_rating');
                return [...otherNotifications, ...ratingNotifications];
            });
            handleLoading();
        }, (error) => {
            console.error("Error fetching ratings notifications:", error);
            handleLoading();
        });
        const now = Timestamp.now();
        const productsQuery = query(
            collection(db, 'products'),
            where('userId', '==', user.uid),
            where('isPremium', '==', true),
            where('premiumHasta', '>', now)
        );
        const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
            const productNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                type: 'premium_active',
                timestamp: doc.data().premiumHasta,
                data: doc.data()
            }));
            setNotifications(prev => {
                const otherNotifications = prev.filter(n => n.type !== 'premium_active');
                return [...otherNotifications, ...productNotifications];
            });
            handleLoading();
        }, (error) => {
            console.error("Error fetching premium products notifications:", error);
            handleLoading();
        });
        return () => {
            unsubscribeRatings();
            unsubscribeProducts();
        };
    }, [user]);

    const sortedNotifications = useMemo(() => {
        return notifications.sort((a, b) => {
            const timeA = a.timestamp?.toDate() || 0;
            const timeB = b.timestamp?.toDate() || 0;
            return timeB - timeA;
        });
    }, [notifications]);
    
    return (
        <div className="min-h-screen bg-[#111] text-white p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 flex items-center justify-center bg-orange-500/20 rounded-full">
                        <Bell className="text-orange-400" size={28} />
                    </div>
                    <h1 className="text-4xl font-bold text-white">
                        Notificaciones
                    </h1>
                </div>

                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <Loader className="animate-spin text-orange-500" size={48} />
                    </div>
                )}

                {!loading && sortedNotifications.length === 0 && (
                    <div className="text-center py-20 px-6 bg-black/30 border border-white/10 rounded-2xl">
                         <Bell size={48} className="mx-auto text-white/20" />
                        <p className="mt-4 text-xl font-semibold text-white/80">Todo está tranquilo por aquí</p>
                        <p className="text-white/50 mt-2">No tienes notificaciones nuevas en este momento.</p>
                    </div>
                )}

                {!loading && sortedNotifications.length > 0 && (
                    <div className="space-y-4">
                        {sortedNotifications.map((notification) => (
                            <NotificationItem key={`${notification.type}-${notification.id}`} notification={notification} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
