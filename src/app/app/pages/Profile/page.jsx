'use client';

// --- Importaciones (Lógica Intacta) ---
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { User, Calendar, Users, MapPin, Edit, Save, Loader, ShieldCheck, Lock, Eye, EyeOff, Phone, LogOut, Star, MessageCircle, AlertTriangle } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Componentes Internos (Estilos Renovados) ---
const ProfileInput = ({ id, label, value, onChange, icon, disabled, type = 'text', placeholder = '' }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-white/70 mb-2">{label}</label>
        <div className="relative">
            <div className="absolute top-1/2 left-3 -translate-y-1/2 text-white/40 pointer-events-none">{icon}</div>
            <input id={id} name={id} type={type} value={value || ''} onChange={onChange} disabled={disabled} placeholder={placeholder} 
                   className={`w-full pl-10 pr-4 py-3 bg-white/5 border-2 border-transparent rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-all duration-300 disabled:bg-white/10 disabled:cursor-not-allowed ${type === 'date' && !value ? 'text-white/40' : 'text-white'}`} />
        </div>
    </div>
);

const ProfileSelect = ({ id, label, value, onChange, icon, disabled, options }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-white/70 mb-2">{label}</label>
        <div className="relative">
            <div className="absolute top-1/2 left-3 -translate-y-1/2 text-white/40 pointer-events-none">{icon}</div>
            <select id={id} name={id} value={value || ''} onChange={onChange} disabled={disabled} className={`w-full pl-10 pr-4 py-3 bg-white/5 border-2 border-transparent rounded-lg focus:outline-none focus:border-orange-500 transition-all duration-300 appearance-none disabled:bg-white/10 disabled:cursor-not-allowed ${!value ? 'text-white/40' : 'text-white'}`}>
                <option value="" disabled className="bg-[#222]">Selecciona una opción...</option>
                {options.map(opt => <option key={opt} value={opt} className="bg-[#222]">{opt}</option>)}
            </select>
        </div>
    </div>
);

const EditableDocumentImage = ({ label, imageUrl, onEdit, disabled, cooldownTimeLeft, editsLeft, maxEdits }) => {
    const formatCooldown = (ms) => {
        if (ms <= 0) return '';
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h`;
        const minutes = Math.ceil(ms / (1000 * 60));
        return `${minutes} min`;
    };

    return (
        <div className="text-center relative group">
            <p className="font-semibold mb-2 text-white/80">{label}</p>
            <div className="relative aspect-video">
                <img src={imageUrl || `https://placehold.co/600x400/111/fff?text=No+Imagen`} alt={label} className="w-full h-full object-cover rounded-lg shadow-md border border-white/10" />
                {!disabled && (
                    <button onClick={onEdit} className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg">
                        <Edit size={32} />
                    </button>
                )}
                {disabled && (
                    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white p-2 rounded-lg text-center">
                        {cooldownTimeLeft > 0 ? (
                            <>
                                <p className="text-xs font-semibold">Puedes editar en:</p>
                                <p className="text-lg font-bold">{formatCooldown(cooldownTimeLeft)}</p>
                            </>
                        ) : (
                            <>
                                <AlertTriangle size={24} className="mb-2 text-yellow-400"/>
                                <p className="text-xs font-semibold">Límite de ediciones</p>
                            </>
                        )}
                    </div>
                )}
            </div>
            {maxEdits !== undefined && <p className="text-xs text-white/50 mt-2">Ediciones restantes: {editsLeft}</p>}
        </div>
    );
};

const PasswordChangeModal = ({ isOpen, onClose, user }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) { Swal.fire({ title: 'Error', text: 'Las nuevas contraseñas no coinciden.', icon: 'error', background: '#1a202c', color: '#ffffff' }); return; }
        if (newPassword.length < 6) { Swal.fire({ title: 'Contraseña Débil', text: 'La nueva contraseña debe tener al menos 6 caracteres.', icon: 'warning', background: '#1a202c', color: '#ffffff' }); return; }
        setLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            Swal.fire({ title: '¡Éxito!', text: 'Tu contraseña ha sido actualizada.', icon: 'success', background: '#1a202c', color: '#ffffff' });
            onClose();
        } catch (error) { Swal.fire({ title: 'Error', text: 'La contraseña actual es incorrecta o ha ocurrido un error.', icon: 'error', background: '#1a202c', color: '#ffffff' }); }
        finally { setLoading(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-[#1a202c] border border-white/10 rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-white">Cambiar Contraseña</h2>
                <div className="space-y-4">
                    <input type="password" placeholder="Contraseña Actual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full p-3 rounded-md bg-white/5 text-white placeholder-white/40 focus:outline-none focus:border-orange-500" />
                    <div className="relative">
                        <input type={showPass ? 'text' : 'password'} placeholder="Nueva Contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 rounded-md bg-white/5 text-white placeholder-white/40 focus:outline-none focus:border-orange-500" />
                        <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-white/40 hover:text-orange-500">{showPass ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                    </div>
                    <input type="password" placeholder="Confirmar Nueva Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 rounded-md bg-white/5 text-white placeholder-white/40 focus:outline-none focus:border-orange-500" />
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="px-4 py-2 rounded-md text-white/70 bg-white/10 hover:bg-white/20">Cancelar</button>
                    <button onClick={handlePasswordChange} disabled={loading} className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-500 disabled:opacity-50">{loading ? 'Cambiando...' : 'Confirmar'}</button>
                </div>
            </div>
        </div>
    );
};

const DisplayRating = ({ rating, count }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} className={`${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`} />
        ))}
        <span className="ml-2 text-sm font-bold text-white">{rating.toFixed(1)}</span>
        {count !== undefined && <span className="ml-1.5 text-sm text-white/60">({count} calificaciones)</span>}
    </div>
);

// --- COMPONENTE PRINCIPAL (Lógica Intacta) ---
export default function ProfilePage() {
    const { user, loading: authLoading, logout } = useAuth();
    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [ratings, setRatings] = useState([]);
    const [imageEditState, setImageEditState] = useState({
        profile: { cooldownLeft: 0, editsLeft: 3 },
        selfie: { cooldownLeft: 0, editsLeft: 2 }
    });
    const MAX_EDITS = { profile: 3, selfie: 2 };
    const departamentos = [ 'Beni', 'Cochabamba', 'Chuquisaca', 'La Paz', 'Oruro', 'Pando', 'Potosí', 'Santa Cruz', 'Tarija' ];
    const sexos = ['Masculino', 'Femenino', 'Prefiero no decirlo'];

    useEffect(() => {
        if (!user) return;
        const ratingsQuery = query(collection(db, `users/${user.uid}/ratings`), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(ratingsQuery, (snapshot) => {
            const ratingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRatings(ratingsData);
        });
        return () => unsubscribe();
    }, [user]);

    const averageRating = useMemo(() => {
        if (ratings.length === 0) return 0;
        return ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length;
    }, [ratings]);

    const fetchUserData = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);
        try {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData(data);
                setFormData(data);
                const fiveDaysInMillis = 5 * 24 * 60 * 60 * 1000;
                const newEditState = { profile: { cooldownLeft: 0, editsLeft: 3 }, selfie: { cooldownLeft: 0, editsLeft: 2 }};
                
                const profileEditCount = data.profileEditCount || 0;
                const profileEditsLeft = MAX_EDITS.profile - profileEditCount;
                let profileCooldownLeft = 0;
                if (data.profileLastUpdatedAt) {
                    const timePassed = Date.now() - data.profileLastUpdatedAt.toDate().getTime();
                    profileCooldownLeft = timePassed < fiveDaysInMillis ? fiveDaysInMillis - timePassed : 0;
                }
                newEditState.profile = { cooldownLeft: profileCooldownLeft, editsLeft: profileEditsLeft > 0 ? profileEditsLeft : 0 };

                const selfieEditCount = data.selfieEditCount || 0;
                const selfieEditsLeft = MAX_EDITS.selfie - selfieEditCount;
                let selfieCooldownLeft = 0;
                if (data.selfieLastUpdatedAt) {
                    const timePassed = Date.now() - data.selfieLastUpdatedAt.toDate().getTime();
                    selfieCooldownLeft = timePassed < fiveDaysInMillis ? fiveDaysInMillis - timePassed : 0;
                }
                newEditState.selfie = { cooldownLeft: selfieCooldownLeft, editsLeft: selfieEditsLeft > 0 ? selfieEditsLeft : 0 };

                setImageEditState(newEditState);
            } else {
                await Swal.fire({ icon: 'error', title: 'Error de Cuenta', text: 'No pudimos encontrar los datos de tu perfil.', background: '#1a202c', color: '#ffffff' });
                logout();
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error de Conexión', text: 'No se pudieron cargar tus datos.', background: '#1a202c', color: '#ffffff' });
        } finally {
            setLoading(false);
        }
    }, [user, logout]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchUserData();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [authLoading, user, fetchUserData]);

    const handleFormChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!editMode) return;
        setLoading(true);
        const dataToUpdate = {
            nombres: formData.nombres, apellidos: formData.apellidos, fechaNacimiento: formData.fechaNacimiento,
            sexo: formData.sexo, lugarResidencia: formData.lugarResidencia,
            telefono: formData.telefono
        };
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, dataToUpdate);
            await updateProfile(user, { displayName: `${formData.nombres} ${formData.apellidos}` });
            setUserData(prev => ({...prev, ...dataToUpdate}));
            setEditMode(false);
            Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'Tu perfil ha sido actualizado.', background: '#1a202c', color: '#ffffff' });
        } catch (error) { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar tu perfil.', background: '#1a202c', color: '#ffffff' }); }
        finally { setLoading(false); }
    };

    const handleImageEdit = (docType) => {
        const { editsLeft, cooldownLeft } = imageEditState[docType];
        if (editsLeft <= 0) { Swal.fire({title: 'Límite Alcanzado', text: 'Has alcanzado el número máximo de ediciones.', icon: 'warning', background: '#1a202c', color: '#ffffff'}); return; }
        if (cooldownLeft > 0) { Swal.fire({title: 'Tiempo de Espera', text: 'Debes esperar para poder editar de nuevo.', icon: 'info', background: '#1a202c', color: '#ffffff'}); return; }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            Swal.fire({ title: `Subiendo imagen...`, allowOutsideClick: false, background: '#1a202c', color: '#ffffff', didOpen: () => { Swal.showLoading(); } });
            try {
                const storageRef = ref(storage, `verification_docs/${user.uid}/${docType}_${Date.now()}`);
                const snapshot = await uploadBytesResumable(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                const currentEditCount = userData[`${docType}EditCount`] || 0;
                const updateData = {
                    [`${docType}URL`]: downloadURL,
                    [`${docType}LastUpdatedAt`]: new Date(),
                    [`${docType}EditCount`]: currentEditCount + 1
                };
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, updateData);
                if (docType === 'profile') { await updateProfile(user, { photoURL: downloadURL }); }
                Swal.close();
                Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'La imagen ha sido actualizada.', background: '#1a202c', color: '#ffffff' });
                fetchUserData();
            } catch (error) { Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'No se pudo actualizar la imagen.', background: '#1a202c', color: '#ffffff' }); }
        };
        input.click();
    };

    const handleLogout = async () => {
        await Swal.fire({
            title: '¿Cerrar sesión?', text: "¿Estás seguro de que quieres salir?", icon: 'question',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, salir', cancelButtonText: 'Cancelar', background: '#1a202c', color: '#ffffff'
        }).then((result) => {
            if (result.isConfirmed) {
                logout().catch(() => { Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo cerrar la sesión.', background: '#1a202c', color: '#ffffff'}); });
            }
        });
    };

    if (authLoading || loading) {
        return <div className="flex justify-center items-center h-screen bg-[#111]"><Loader className="animate-spin text-orange-500" size={48} /></div>;
    }
    if (!user || !userData) {
        return <div className="flex justify-center items-center h-screen bg-[#111]"><Loader className="animate-spin text-orange-500" size={48} /></div>;
    }

    return (
        <div className="min-h-screen bg-[#111] text-white p-4 sm:p-8">
            <PasswordChangeModal isOpen={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)} user={user} />
            <div className="max-w-4xl mx-auto space-y-8">
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <img src={user.photoURL || `https://ui-avatars.com/api/?name=${userData.nombres}+${userData.apellidos}&background=222&color=fff`} alt="Foto de perfil" className="w-24 h-24 rounded-full object-cover border-4 border-orange-500/50" />
                        <div>
                            <h1 className="text-3xl font-bold text-white">{userData.nombres} {userData.apellidos}</h1>
                            <p className="text-white/60">{userData.email}</p>
                            {userData.isSellerVerified && <span className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded-full"><ShieldCheck size={14} /> Vendedor Verificado</span>}
                        </div>
                    </div>
                    <button type="button" onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 font-semibold rounded-lg hover:bg-red-500/30 transition-colors self-start sm:self-center">
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
                
                {userData.isSellerVerified && (
                    <div id="ratings-section" className="bg-black/30 backdrop-blur-lg border border-white/10 p-6 sm:p-8 rounded-2xl scroll-mt-20">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-3"><MessageCircle className="text-orange-400"/> Mis Calificaciones</h2>
                            <DisplayRating rating={averageRating} count={ratings.length} />
                        </div>
                        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4">
                            {ratings.length > 0 ? ratings.map(r => (
                                <div key={r.id} className="flex items-start gap-4 border-b border-white/10 pb-4 last:border-b-0">
                                    <img src={r.reviewerPhotoURL || `https://ui-avatars.com/api/?name=${r.reviewerName}&background=222&color=fff`} alt={r.reviewerName} className="w-10 h-10 rounded-full" />
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-white">{r.reviewerName}</p>
                                            <span className="text-xs text-white/50">{formatDistanceToNow(r.createdAt.toDate(), { addSuffix: true, locale: es })}</span>
                                        </div>
                                        <DisplayRating rating={r.rating} />
                                        <p className="mt-2 text-white/80 bg-white/5 p-3 rounded-lg whitespace-pre-wrap">{r.comment}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-white/50 py-8">Aún no has recibido ninguna calificación.</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="bg-black/30 backdrop-blur-lg border border-white/10 p-6 sm:p-8 rounded-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Datos Personales</h2>
                        <button type="button" onClick={() => setEditMode(!editMode)} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white/80 font-semibold rounded-lg hover:bg-white/20 transition-colors">{!editMode && <Edit size={18} />} {!editMode ? 'Editar' : 'Cancelar'}</button>
                    </div>
                    <form onSubmit={handleFormSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProfileInput id="nombres" label="Nombres" value={formData.nombres} onChange={handleFormChange} icon={<User size={20} />} disabled={!editMode} />
                            <ProfileInput id="apellidos" label="Apellidos" value={formData.apellidos} onChange={handleFormChange} icon={<User size={20} />} disabled={!editMode} />
                            <ProfileInput id="fechaNacimiento" label="Fecha de Nacimiento" value={formData.fechaNacimiento} onChange={handleFormChange} icon={<Calendar size={20} />} disabled={!editMode} type="date" />
                            <ProfileInput id="telefono" label="Teléfono (WhatsApp)" value={formData.telefono} onChange={handleFormChange} icon={<Phone size={20} />} disabled={!editMode} type="number" placeholder="Ej: 71234567" />
                            <ProfileSelect id="sexo" label="Sexo" value={formData.sexo} onChange={handleFormChange} icon={<Users size={20} />} disabled={!editMode} options={sexos} />
                            <ProfileSelect id="lugarResidencia" label="Lugar de Residencia" value={formData.lugarResidencia} onChange={handleFormChange} icon={<MapPin size={20} />} disabled={!editMode} options={departamentos} />
                        </div>
                        {editMode && <div className="text-right mt-6"><button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-500 transition-colors"><Save size={18} /> Guardar Cambios</button></div>}
                    </form>
                    
                    <div className="mt-10 pt-6 border-t border-white/10">
                        <h2 className="text-xl font-bold mb-4">Seguridad</h2>
                        <button type="button" onClick={() => setPasswordModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white/80 font-semibold rounded-lg hover:bg-white/20 transition-colors"><Lock size={18} /> Cambiar Contraseña</button>
                    </div>
                    
                    {userData.isSellerVerified && (
                        <div className="mt-10 pt-6 border-t border-white/10">
                            <h2 className="text-xl font-bold mb-6">Documentos de Vendedor</h2>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
                                <EditableDocumentImage 
                                    label="Foto de Perfil" 
                                    imageUrl={userData.photoURL} 
                                    onEdit={() => handleImageEdit('profile')}
                                    disabled={imageEditState.profile.cooldownLeft > 0 || imageEditState.profile.editsLeft <= 0}
                                    cooldownTimeLeft={imageEditState.profile.cooldownLeft}
                                    editsLeft={imageEditState.profile.editsLeft}
                                    maxEdits={MAX_EDITS.profile}
                                />
                                <EditableDocumentImage 
                                    label="Selfie" 
                                    imageUrl={userData.selfieURL} 
                                    onEdit={() => handleImageEdit('selfie')}
                                    disabled={imageEditState.selfie.cooldownLeft > 0 || imageEditState.selfie.editsLeft <= 0}
                                    cooldownTimeLeft={imageEditState.selfie.cooldownLeft}
                                    editsLeft={imageEditState.selfie.editsLeft}
                                    maxEdits={MAX_EDITS.selfie}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {!userData.isSellerVerified && (
                    <div className="mt-8 text-center bg-black/30 backdrop-blur-lg border border-white/10 p-8 rounded-2xl">
                        <h2 className="text-2xl font-bold mb-2">¿Quieres vender en Tagwear?</h2>
                        <p className="text-white/60 mb-6">Verifica tu perfil para empezar a publicar tus productos y llegar a toda Bolivia.</p>
                        <Link href="/app/pages/Profile_Ventas/PerfilCreate" className="inline-block px-8 py-3 bg-green-600 text-white font-bold rounded-full hover:bg-green-500 transition-transform transform hover:scale-105 shadow-lg shadow-green-500/20">
                            Convertirme en Vendedor
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
