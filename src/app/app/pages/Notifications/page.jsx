'use client';

// --- Importaciones ---
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Loader, Star, Bell, Clock, MessageSquare, Award, ChevronDown } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Componente para una Notificación Individual (Sin cambios) ---
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

// --- Función para obtener la cabecera del grupo de fechas (Sin cambios) ---
const getGroupHeader = (date, locale) => {
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    if (isThisWeek(date, { locale })) return 'Esta semana';
    if (isThisMonth(date)) return 'Este mes';
    return format(date, 'MMMM yyyy', { locale });
};

const recentGroups = ['Hoy', 'Ayer', 'Esta semana', 'Este mes'];

// --- Componente Principal de la Página de Notificaciones ---
export default function NotificationsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    // ✅ NUEVO ESTADO: Para el filtro activo
    const [filter, setFilter] = useState('all'); // 'all', 'new_rating', 'premium_active'
    // ✅ NUEVO ESTADO: Para los grupos colapsados
    const [collapsedGroups, setCollapsedGroups] = useState(new Set());

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const ratingsQuery = query(collection(db, `users/${user.uid}/ratings`), orderBy('createdAt', 'desc'));
        const unsubscribeRatings = onSnapshot(ratingsQuery, (snapshot) => {
            const ratingNotifications = snapshot.docs.map(doc => ({ id: doc.id, type: 'new_rating', timestamp: doc.data().createdAt, data: doc.data() }));
            setNotifications(prev => [...prev.filter(n => n.type !== 'new_rating'), ...ratingNotifications]);
        });

        const now = Timestamp.now();
        const productsQuery = query(collection(db, 'products'), where('userId', '==', user.uid), where('isPremium', '==', true), where('premiumHasta', '>', now));
        const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
            const productNotifications = snapshot.docs.map(doc => ({ id: doc.id, type: 'premium_active', timestamp: doc.data().premiumHasta, data: doc.data() }));
            setNotifications(prev => [...prev.filter(n => n.type !== 'premium_active'), ...productNotifications]);
        });

        Promise.all([
            new Promise(resolve => onSnapshot(ratingsQuery, () => resolve(), () => resolve())),
            new Promise(resolve => onSnapshot(productsQuery, () => resolve(), () => resolve()))
        ]).then(() => setLoading(false));

        return () => {
            unsubscribeRatings();
            unsubscribeProducts();
        };
    }, [user]);

    // ✅ LÓGICA MEJORADA: Filtra y agrupa las notificaciones
    const groupedNotifications = useMemo(() => {
        const filtered = notifications.filter(n => filter === 'all' || n.type === filter);
        const sorted = filtered.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
        
        return sorted.reduce((groups, notification) => {
            const date = notification.timestamp?.toDate();
            if (!date) return groups;
            const header = getGroupHeader(date, es);
            if (!groups[header]) groups[header] = [];
            groups[header].push(notification);
            return groups;
        }, {});
    }, [notifications, filter]);

    // ✅ NUEVO EFECTO: Colapsa los grupos antiguos por defecto
    useEffect(() => {
        const oldGroups = Object.keys(groupedNotifications).filter(header => !recentGroups.includes(header));
        setCollapsedGroups(new Set(oldGroups));
    }, [notifications, filter]); // Se recalcula si las notificaciones o el filtro cambian

    const toggleGroup = (header) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(header)) {
                newSet.delete(header);
            } else {
                newSet.add(header);
            }
            return newSet;
        });
    };
    
    return (
        <div className="min-h-screen bg-[#111] text-white p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 flex items-center justify-center bg-orange-500/20 rounded-full">
                        <Bell className="text-orange-400" size={28} />
                    </div>
                    <h1 className="text-4xl font-bold text-white">Notificaciones</h1>
                </div>

                {/* ✅ SECCIÓN DE FILTROS */}
                <div className="flex items-center gap-2 mb-8 p-1 bg-black/30 border border-white/10 rounded-full">
                    <button onClick={() => setFilter('all')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${filter === 'all' ? 'bg-orange-500 text-white' : 'text-white/60 hover:bg-white/10'}`}>
                        <Bell size={16} /> Todas
                    </button>
                    <button onClick={() => setFilter('new_rating')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${filter === 'new_rating' ? 'bg-orange-500 text-white' : 'text-white/60 hover:bg-white/10'}`}>
                        <MessageSquare size={16} /> Calificaciones
                    </button>
                    <button onClick={() => setFilter('premium_active')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${filter === 'premium_active' ? 'bg-orange-500 text-white' : 'text-white/60 hover:bg-white/10'}`}>
                        <Award size={16} /> Premium
                    </button>
                </div>

                {loading && (
                    <div className="flex justify-center items-center py-20"><Loader className="animate-spin text-orange-500" size={48} /></div>
                )}

                {!loading && Object.keys(groupedNotifications).length === 0 && (
                    <div className="text-center py-20 px-6 bg-black/30 border border-white/10 rounded-2xl">
                        <Bell size={48} className="mx-auto text-white/20" />
                        <p className="mt-4 text-xl font-semibold text-white/80">No hay notificaciones</p>
                        <p className="text-white/50 mt-2">No tienes notificaciones que coincidan con el filtro seleccionado.</p>
                    </div>
                )}

                {/* ✅ RENDERIZADO CON GRUPOS COLAPSABLES */}
                {!loading && Object.keys(groupedNotifications).length > 0 && (
                    <div className="space-y-8">
                        {Object.entries(groupedNotifications).map(([groupHeader, groupNotifications]) => {
                            const isCollapsible = !recentGroups.includes(groupHeader);
                            const isCollapsed = isCollapsible && collapsedGroups.has(groupHeader);
                            return (
                                <div key={groupHeader}>
                                    <button 
                                        onClick={() => isCollapsible && toggleGroup(groupHeader)}
                                        className={`w-full flex justify-between items-center text-lg font-bold text-white/80 mb-4 pb-2 border-b-2 border-white/10 ${isCollapsible ? 'cursor-pointer hover:text-white' : 'cursor-default'}`}
                                        disabled={!isCollapsible}
                                    >
                                        <span>{groupHeader}</span>
                                        {isCollapsible && (
                                            <ChevronDown className={`transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`} size={24} />
                                        )}
                                    </button>
                                    {!isCollapsed && (
                                        <div className="space-y-4 animate-fade-in">
                                            {groupNotifications.map((notification) => (
                                                <NotificationItem key={`${notification.type}-${notification.id}`} notification={notification} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

