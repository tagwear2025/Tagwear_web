// src/app/app/pages/Profile/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { User, Calendar, Users, MapPin, Edit, Save, Loader, ShieldCheck, Image as ImageIcon, Lock, Eye, EyeOff, Phone, LogOut } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

// --- Componentes internos no cambian ---
const ProfileInput = ({ id, label, value, onChange, icon, disabled, type = 'text', placeholder = '' }) => (
    <div className="relative">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <div className="absolute top-9 left-3 text-gray-400">{icon}</div>
        <input id={id} name={id} type={type} value={value || ''} onChange={onChange} disabled={disabled} placeholder={placeholder} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-gray-900 dark:text-gray-100 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed" />
    </div>
);
const ProfileSelect = ({ id, label, value, onChange, icon, disabled, options }) => (
    <div className="relative">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <div className="absolute top-9 left-3 text-gray-400">{icon}</div>
        <select id={id} name={id} value={value || ''} onChange={onChange} disabled={disabled} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-gray-900 dark:text-gray-100 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed appearance-none">
            <option value="" disabled>Selecciona una opción...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);
const EditableDocumentImage = ({ label, imageUrl, onEdit, disabled, cooldownTimeLeft }) => {
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
            <p className="font-semibold mb-2">{label}</p>
            <div className="relative">
                <img src={imageUrl || `https://placehold.co/600x400/e2e8f0/64748b?text=No+Imagen`} alt={label} className="w-full h-40 object-cover rounded-lg shadow-md" />
                {!disabled && (
                    <button onClick={onEdit} className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg">
                        <Edit size={32} />
                    </button>
                )}
                {disabled && cooldownTimeLeft > 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white p-2 rounded-lg">
                        <p className="text-xs font-semibold">Puedes editar en:</p>
                        <p className="text-lg font-bold">{formatCooldown(cooldownTimeLeft)}</p>
                    </div>
                )}
            </div>
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
        if (newPassword !== confirmPassword) { Swal.fire('Error', 'Las nuevas contraseñas no coinciden.', 'error'); return; }
        if (newPassword.length < 6) { Swal.fire('Contraseña Débil', 'La nueva contraseña debe tener al menos 6 caracteres.', 'warning'); return; }
        setLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            Swal.fire('¡Éxito!', 'Tu contraseña ha sido actualizada.', 'success');
            onClose();
        } catch (error) { Swal.fire('Error', 'La contraseña actual es incorrecta o ha ocurrido un error.', 'error'); }
        finally { setLoading(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
    };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">Cambiar Contraseña</h2>
                <div className="space-y-4">
                    <input type="password" placeholder="Contraseña Actual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-700" />
                    <div className="relative">
                        <input type={showPass ? 'text' : 'password'} placeholder="Nueva Contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-700" />
                        <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-gray-500">{showPass ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                    </div>
                    <input type="password" placeholder="Confirmar Nueva Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300">Cancelar</button>
                    <button onClick={handlePasswordChange} disabled={loading} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400">{loading ? 'Cambiando...' : 'Confirmar'}</button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function ProfilePage() {
    const { user, loading: authLoading, logout } = useAuth();
    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);

    const departamentos = [ 'Beni', 'Cochabamba', 'Chuquisaca', 'La Paz', 'Oruro', 'Pando', 'Potosí', 'Santa Cruz', 'Tarija' ];
    const sexos = ['Masculino', 'Femenino', 'Prefiero no decirlo'];

    const fetchUserData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData(data);
                setFormData(data);
                if (data.documentsLastUpdatedAt) {
                    const fiveDaysInMillis = 5 * 24 * 60 * 60 * 1000;
                    const lastUpdateTime = data.documentsLastUpdatedAt.toDate();
                    const timePassed = Date.now() - lastUpdateTime.getTime();
                    setCooldownTimeLeft(timePassed < fiveDaysInMillis ? fiveDaysInMillis - timePassed : 0);
                }
            } else {
                // ✅ MEJORA: Manejar el caso de un documento no encontrado.
                // Esto indica un estado inconsistente (auth sí, db no).
                console.error(`Error Crítico: El usuario ${user.uid} está autenticado pero su documento no existe en Firestore.`);
                await Swal.fire({
                    icon: 'error',
                    title: 'Error de Cuenta',
                    text: 'No pudimos encontrar los datos de tu perfil. Esto puede ocurrir con cuentas antiguas. Por favor, cierra sesión y regístrate de nuevo.',
                    confirmButtonText: 'Entendido'
                });
                // Forzar el cierre de sesión para resolver el estado inconsistente.
                logout();
            }
        } catch (error) {
            console.error("Error al cargar los datos del usuario:", error);
            Swal.fire('Error de Conexión', 'No se pudieron cargar tus datos. Por favor, revisa tu conexión a internet e inténtalo de nuevo.', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, logout]); // Añadir logout a las dependencias

    useEffect(() => {
        if (!authLoading && user) {
            fetchUserData();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [authLoading, user, fetchUserData]);

    // ... (El resto de tus funciones: handleFormChange, handleFormSubmit, etc. permanecen igual)
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
            const response = await fetch(`/api/users/${user.uid}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToUpdate),
            });
            if (!response.ok) throw new Error('Falló la actualización del perfil');
            await updateProfile(user, { displayName: `${formData.nombres} ${formData.apellidos}` });
            setUserData(prev => ({...prev, ...dataToUpdate}));
            setEditMode(false);
            Swal.fire('¡Éxito!', 'Tu perfil ha sido actualizado.', 'success');
        } catch (error) { Swal.fire('Error', 'No se pudo actualizar tu perfil.', 'error'); }
        finally { setLoading(false); }
    };

    const handleImageEdit = (docType, oldImageUrl) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            Swal.fire({ title: `Subiendo imagen...`, allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
            try {
                const storageRef = ref(storage, `verification_docs/${user.uid}/${docType}_${Date.now()}`);
                const snapshot = await uploadBytesResumable(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                
                const response = await fetch('/api/users/update-document-image', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.uid, docType, newImageUrl: downloadURL, oldImageUrl }),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                if (docType === 'profile') { await updateProfile(user, { photoURL: downloadURL }); }
                
                Swal.close();
                Swal.fire('¡Éxito!', 'La imagen ha sido actualizada.', 'success');
                fetchUserData();
            } catch (error) { Swal.fire('Error', error.message || 'No se pudo actualizar la imagen.', 'error'); }
        };
        input.click();
    };

    const handleLogout = async () => {
        await Swal.fire({
            title: '¿Cerrar sesión?',
            text: "¿Estás seguro de que quieres salir de tu cuenta?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                logout().catch(() => {
                    Swal.fire('Error', 'No se pudo cerrar la sesión. Inténtalo de nuevo.', 'error');
                });
            }
        });
    };

    if (authLoading || loading) {
        return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-blue-500" size={48} /></div>;
    }

    if (!user || !userData) {
        // Esta barrera se activa durante el logout o si los datos no se cargaron y se forzó el logout.
        return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-blue-500" size={48} /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-8">
            <PasswordChangeModal isOpen={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)} user={user} />
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-6">
                        <img src={user.photoURL || `https://ui-avatars.com/api/?name=${userData.nombres}+${userData.apellidos}&background=random`} alt="Foto de perfil" className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white dark:border-gray-700" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{userData.nombres} {userData.apellidos}</h1>
                            <p className="text-gray-600 dark:text-gray-400">{userData.email}</p>
                            {userData.isSellerVerified && <span className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full dark:bg-green-900 dark:text-green-300"><ShieldCheck size={14} /> Vendedor Verificado</span>}
                        </div>
                    </div>
                    <button type="button" onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors self-start sm:self-center">
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Datos Personales</h2>
                        <button type="button" onClick={() => setEditMode(!editMode)} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">{!editMode && <Edit size={18} />} {!editMode ? 'Editar' : 'Cancelar'}</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProfileInput id="nombres" label="Nombres" value={formData.nombres} onChange={handleFormChange} icon={<User size={20} />} disabled={!editMode} />
                        <ProfileInput id="apellidos" label="Apellidos" value={formData.apellidos} onChange={handleFormChange} icon={<User size={20} />} disabled={!editMode} />
                        <ProfileInput id="fechaNacimiento" label="Fecha de Nacimiento" value={formData.fechaNacimiento} onChange={handleFormChange} icon={<Calendar size={20} />} disabled={!editMode} type="date" />
                        <ProfileInput id="telefono" label="Teléfono (WhatsApp)" value={formData.telefono} onChange={handleFormChange} icon={<Phone size={20} />} disabled={!editMode} type="number" placeholder="Ej: 71234567" />
                        <ProfileSelect id="sexo" label="Sexo" value={formData.sexo} onChange={handleFormChange} icon={<Users size={20} />} disabled={!editMode} options={sexos} />
                        <ProfileSelect id="lugarResidencia" label="Lugar de Residencia" value={formData.lugarResidencia} onChange={handleFormChange} icon={<MapPin size={20} />} disabled={!editMode} options={departamentos} />
                    </div>
                    {editMode && <div className="text-right mt-6"><button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"><Save size={18} /> Guardar Cambios</button></div>}
                    
                    <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-6">Seguridad</h2>
                        <button type="button" onClick={() => setPasswordModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"><Lock size={18} /> Cambiar Contraseña</button>
                    </div>
                    
                    {userData.isSellerVerified ? (
                        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold mb-6">Documentos de Vendedor</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <EditableDocumentImage label="Foto de Perfil" imageUrl={userData.photoURL} onEdit={() => handleImageEdit('profile', userData.photoURL)} />
                                <EditableDocumentImage label="Carnet de Identidad" imageUrl={userData.idCardURL} onEdit={() => handleImageEdit('idCard', userData.idCardURL)} disabled={cooldownTimeLeft > 0} cooldownTimeLeft={cooldownTimeLeft} />
                                <EditableDocumentImage label="Licencia de Conducir" imageUrl={userData.licenseURL} onEdit={() => handleImageEdit('license', userData.licenseURL)} disabled={cooldownTimeLeft > 0} cooldownTimeLeft={cooldownTimeLeft} />
                            </div>
                        </div>
                    ) : (
                        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 text-center bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                            <h2 className="text-xl font-bold mb-2">¿Quieres vender en Tagwear?</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">Verifica tu perfil para empezar a publicar tus productos.</p>
                            <Link href="/app/pages/Profile_Ventas/PerfilCreate" className="inline-block px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105">Convertirme en Vendedor</Link>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
