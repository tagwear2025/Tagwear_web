'use client';

import { useEffect, useState, useMemo } from 'react';
// ✅ CORRECCIÓN: Se añade 'deleteDoc' a la lista de importaciones.
import { collection, onSnapshot, query, where, doc, updateDoc, deleteDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Swal from 'sweetalert2';
import { useTheme } from '@/context/ThemeContext';
import { CheckCircle, XCircle, Clock, Loader, Inbox, Star, Search, Edit, CalendarOff } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function AdminPremiumRequestsPage() {
    const [pendingSolicitudes, setPendingSolicitudes] = useState([]);
    const [approvedSolicitudes, setApprovedSolicitudes] = useState([]);
    const [view, setView] = useState('pendientes'); // 'pendientes' o 'aprobadas'
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const { isDark, isLoaded } = useTheme();
    
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('approve'); // 'approve' o 'edit'
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [premiumEndDate, setPremiumEndDate] = useState(new Date());

    const swalTheme = { background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f9fafb' : '#111827' };

    useEffect(() => {
        const fetchRequests = (status, setter) => {
            const q = query(collection(db, 'solicitudesPremium'), where('status', '==', status));
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setter(data);
                setLoading(false);
            }, (error) => {
                console.error(`Error fetching ${status} requests:`, error);
                Swal.fire({ title: 'Error de Conexión', text: `No se pudieron cargar las solicitudes ${status}.`, icon: 'error', ...swalTheme });
                setLoading(false);
            });
        };

        const unsubscribePending = fetchRequests('pendiente', setPendingSolicitudes);
        const unsubscribeApproved = fetchRequests('aprobada', setApprovedSolicitudes);

        return () => {
            unsubscribePending();
            unsubscribeApproved();
        };
    }, []);

    const filteredSolicitudes = useMemo(() => {
        const source = view === 'pendientes' ? pendingSolicitudes : approvedSolicitudes;
        if (!searchTerm) return source;
        const term = searchTerm.toLowerCase();
        return source.filter(sol => 
            sol.userName?.toLowerCase().includes(term) || 
            sol.productName?.toLowerCase().includes(term)
        );
    }, [searchTerm, view, pendingSolicitudes, approvedSolicitudes]);

    const openModal = (solicitud, mode) => {
        setModalMode(mode);
        setSelectedSolicitud(solicitud);
        if (mode === 'edit' && solicitud.premiumHasta) {
            setPremiumEndDate(solicitud.premiumHasta.toDate());
        } else {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            setPremiumEndDate(futureDate);
        }
        setShowModal(true);
    };

    const handleConfirmModal = async () => {
        if (!selectedSolicitud) return;
        const loadingSwal = Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), ...swalTheme });
        
        try {
            const productRef = doc(db, 'products', selectedSolicitud.productId);
            const solicitudRef = doc(db, 'solicitudesPremium', selectedSolicitud.id);

            if (modalMode === 'approve') {
                await updateDoc(productRef, { isPremium: true, premiumHasta: premiumEndDate });
                await updateDoc(solicitudRef, { status: 'aprobada', fechaAprobacion: serverTimestamp(), premiumHasta: premiumEndDate });
                Swal.fire({ title: '¡Aprobado!', text: `El producto "${selectedSolicitud.productName}" ahora es premium.`, icon: 'success', ...swalTheme });
            } else if (modalMode === 'edit') {
                await updateDoc(productRef, { premiumHasta: premiumEndDate });
                await updateDoc(solicitudRef, { premiumHasta: premiumEndDate });
                Swal.fire({ title: '¡Actualizado!', text: 'La fecha de vencimiento ha sido actualizada.', icon: 'success', ...swalTheme });
            }
            setShowModal(false);
            setSelectedSolicitud(null);
        } catch (error) {
            Swal.fire({ title: 'Error', text: 'No se pudo completar la operación.', icon: 'error', ...swalTheme });
            console.error("Error confirming modal:", error);
        } finally {
            loadingSwal.close();
        }
    };

    const handleReject = async (solicitud) => {
        const result = await Swal.fire({ title: '¿Rechazar Solicitud?', text: 'La solicitud se eliminará permanentemente.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, rechazar', ...swalTheme });
        if (result.isConfirmed) {
            await deleteDoc(doc(db, 'solicitudesPremium', solicitud.id));
            Swal.fire({ title: 'Rechazada', text: 'La solicitud ha sido eliminada.', icon: 'info', ...swalTheme });
        }
    };

    const handleCancelPremium = async (solicitud) => {
        const result = await Swal.fire({ title: '¿Cancelar Premium?', text: `El producto "${solicitud.productName}" dejará de ser premium.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, cancelar premium', ...swalTheme });
        if (result.isConfirmed) {
            const productRef = doc(db, 'products', solicitud.productId);
            const solicitudRef = doc(db, 'solicitudesPremium', solicitud.id);
            try {
                await updateDoc(productRef, { isPremium: false, premiumHasta: deleteField() });
                await deleteDoc(solicitudRef);
                Swal.fire({ title: 'Cancelado', text: 'El producto ya no es premium.', icon: 'success', ...swalTheme });
            } catch (error) {
                Swal.fire({ title: 'Error', text: 'No se pudo cancelar el estado premium.', icon: 'error', ...swalTheme });
            }
        }
    };
    
    const cardStyle = { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb' };
    const labelStyle = { color: isDark ? '#f9fafb' : '#111827' };
    const valueStyle = { color: isDark ? '#d1d5db' : '#6b7280' };

    if (loading || !isLoaded) {
        return <section className="p-8 min-h-screen flex justify-center items-center" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}><Loader className="animate-spin text-blue-500" size={48} /></section>;
    }

    return (
        <div className="p-4 md:p-6 min-h-screen" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-4" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}>Solicitudes de Productos Premium</h1>
                
                {/* Pestañas */}
                <div className="flex border-b mb-6" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                    <button onClick={() => setView('pendientes')} className={`px-4 py-2 text-sm font-semibold transition-colors ${view === 'pendientes' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}>Pendientes ({pendingSolicitudes.length})</button>
                    <button onClick={() => setView('aprobadas')} className={`px-4 py-2 text-sm font-semibold transition-colors ${view === 'aprobadas' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}>Aprobadas ({approvedSolicitudes.length})</button>
                </div>

                <div className="relative mb-6">
                    <input type="text" placeholder="Buscar por vendedor o producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 transition" style={{...cardStyle, ...labelStyle}}/>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filteredSolicitudes.length === 0 ? (
                        <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-dashed">
                            <Inbox size={48} className="mx-auto text-gray-400" />
                            <p className="mt-4 font-semibold text-xl" style={labelStyle}>{searchTerm ? 'No se encontraron resultados.' : `No hay solicitudes ${view}.`}</p>
                        </div>
                    ) : (
                        filteredSolicitudes.map(solicitud => (
                            <div key={solicitud.id} className="p-5 rounded-lg shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border" style={cardStyle}>
                                <div className="space-y-1 flex-grow">
                                    <p style={valueStyle}><strong style={labelStyle}>Producto:</strong> {solicitud.productName}</p>
                                    <p style={valueStyle}><strong style={labelStyle}>Vendedor:</strong> {solicitud.userName}</p>
                                    {view === 'pendientes' && <p style={valueStyle} className="flex items-center gap-2"><Clock size={14}/> <strong style={labelStyle}>Solicitud:</strong> {new Date(solicitud.fechaSolicitud?.toDate()).toLocaleString()}</p>}
                                    {view === 'aprobadas' && (
                                        <>
                                            <p style={valueStyle} className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> <strong style={labelStyle}>Aprobado:</strong> {new Date(solicitud.fechaAprobacion?.toDate()).toLocaleString()}</p>
                                            <p style={valueStyle} className="flex items-center gap-2"><CalendarOff size={14} className="text-red-500"/> <strong style={labelStyle}>Vence:</strong> {new Date(solicitud.premiumHasta?.toDate()).toLocaleDateString()}</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                    {solicitud.userPhone && (
                                        <a href={`https://wa.me/591${solicitud.userPhone}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition" title="Contactar por WhatsApp">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>
                                        </a>
                                    )}
                                    {view === 'pendientes' ? (
                                        <>
                                            <button onClick={() => openModal(solicitud, 'approve')} className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"><CheckCircle size={18}/> Aprobar</button>
                                            <button onClick={() => handleReject(solicitud)} className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"><XCircle size={18}/> Rechazar</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => openModal(solicitud, 'edit')} className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"><Edit size={18}/> Editar</button>
                                            <button onClick={() => handleCancelPremium(solicitud)} className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"><XCircle size={18}/> Cancelar</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showModal && selectedSolicitud && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Star className="text-yellow-400"/>
                            {modalMode === 'approve' ? 'Aprobar Producto Premium' : 'Editar Vencimiento Premium'}
                        </h2>
                        <p className="mb-6" style={valueStyle}>
                            {modalMode === 'approve' ? 'Selecciona la fecha de vencimiento para el producto:' : 'Actualiza la fecha de vencimiento para el producto:'}
                            <strong style={labelStyle}> {selectedSolicitud.productName}</strong>
                        </p>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium" style={labelStyle}>Válido hasta:</label>
                            <DatePicker selected={premiumEndDate} onChange={(date) => setPremiumEndDate(date)} dateFormat="dd/MM/yyyy" minDate={new Date()} className="w-full mt-1 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                            <button onClick={handleConfirmModal} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                                {modalMode === 'approve' ? 'Confirmar Aprobación' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
