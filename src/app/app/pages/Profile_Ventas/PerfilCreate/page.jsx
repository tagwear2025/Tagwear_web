// src/app/pages/Profile_Ventas/PerfilCreate/page.jsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import Swal from 'sweetalert2';
import { User, Camera, CheckCircle, X, Upload, Phone } from 'lucide-react';

// --- Componente de Modal para la Cámara (MODIFICADO PARA ESTABILIDAD) ---
const CameraModal = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    // Usamos useRef para el stream para evitar re-renderizados innecesarios
    const streamRef = useRef(null);
    const [error, setError] = useState(null);
    // Nuevo estado para saber si el stream está activo
    const [isStreaming, setIsStreaming] = useState(false);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setIsStreaming(false);
        }
    }, []); // Dependencias vacías porque useRef no causa re-renderizados

    const startCamera = useCallback(async () => {
        // Detener cualquier cámara anterior
        stopCamera();
        setError(null);
        setIsStreaming(false);

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            streamRef.current = mediaStream; // Guardamos el stream en el ref
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setIsStreaming(true); // Indicamos que el stream está listo
        } catch (err) {
            console.error("Error accessing camera:", err);
            if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                setError("No se encontró ninguna cámara en tu dispositivo.");
            } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setError("Has denegado el permiso para usar la cámara. Por favor, actívalo en la configuración de tu navegador.");
            } else {
                setError("No se pudo acceder a la cámara. Inténtalo de nuevo o sube un archivo.");
            }
            setIsStreaming(false);
        }
    }, [stopCamera]); // Dependemos de stopCamera que es estable

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }

        // La función de limpieza se asegura de que la cámara se detenga al desmontar el componente
        return () => {
            stopCamera();
        };
    }, [isOpen, startCamera, stopCamera]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current && streamRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            canvas.toBlob(blob => {
                const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
                onCapture(file);
                onClose(); // Cierra el modal después de la captura
            }, 'image/jpeg');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                    <X size={24} />
                </button>
                <h2 className="text-xl font-bold text-center mb-4">Tómate una Selfie</h2>
                <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video relative">
                    {error ? (
                        <div className="w-full h-full flex items-center justify-center text-center text-red-400 p-4">{error}</div>
                    ) : (
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="mt-6 text-center">
                    <button
                        onClick={handleCapture}
                        // El botón se activa solo si hay stream y no hay error
                        disabled={!isStreaming || !!error}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                    >
                        <Camera size={20} />
                        Capturar Foto
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Componente unificado para subir imagen (sin cambios) ---
const ImageUploadField = ({ id, label, description, icon, onFileSelect, onCameraClick, file, preview, showCameraOption }) => (
    <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 h-full flex flex-col justify-between">
        <div className="flex-grow flex flex-col items-center justify-center">
            {preview ? (
                <img src={preview} alt={`${label} preview`} className="w-48 h-32 mx-auto rounded-lg object-cover mb-4" />
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 h-32">
                    {icon}
                    <p className="mt-2 font-semibold">{label}</p>
                </div>
            )}
        </div>
        <div className="mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 h-10 flex items-center justify-center">{description}</p>

            {showCameraOption ? (
                <button type="button" onClick={onCameraClick} className="w-full px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    Abrir Cámara
                </button>
            ) : (
                <label htmlFor={id} className="w-full inline-block px-4 py-2 text-sm font-bold text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                    Subir Archivo
                    <input id={id} type="file" className="hidden" accept="image/*" onChange={(e) => onFileSelect(e.target.files[0])} />
                </label>
            )}

            {file && (
                <div className="mt-2 text-sm font-medium text-green-600 flex items-center justify-center gap-2 break-all px-2">
                    <CheckCircle size={16} />
                    <span>{file.name}</span>
                </div>
            )}
        </div>
    </div>
);

// --- Página principal (sin cambios) ---
export default function PerfilCreatePage() {
    const { user } = useAuth();
    const router = useRouter();

    const [files, setFiles] = useState({
        profile: null,
        selfie: null,
    });
    const [previews, setPreviews] = useState({
        profile: null,
        selfie: null,
    });
    const [telefono, setTelefono] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [hasCamera, setHasCamera] = useState(false);
    const [checkingCamera, setCheckingCamera] = useState(true);

    useEffect(() => {
        const checkCamera = async () => {
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const hasVideoInput = devices.some(device => device.kind === 'videoinput');
                    setHasCamera(hasVideoInput);
                } catch (error) {
                    console.error("Error enumerating devices:", error);
                    setHasCamera(false);
                }
            } else {
                setHasCamera(false);
            }
            setCheckingCamera(false);
        };
        checkCamera();
    }, []);

    const handleFileSelect = (file, type) => {
        if (file && file.type.startsWith('image/')) {
            setFiles(prev => ({ ...prev, [type]: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [type]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!files.profile || !files.selfie || !telefono) {
            Swal.fire('Campos Incompletos', 'Por favor, completa tu número de WhatsApp y sube las dos imágenes.', 'warning');
            return;
        }
        if (telefono.length < 8) {
            Swal.fire('Número Inválido', 'El número de WhatsApp debe tener al menos 8 dígitos.', 'warning');
            return;
        }
        setLoading(true);

        try {
            const uploadPromises = Object.entries(files).map(([type, file]) => {
                const storageRef = ref(storage, `verification_docs/${user.uid}/${type}_${file.name}`);
                const uploadTask = uploadBytesResumable(storageRef, file);
                return new Promise((resolve, reject) => {
                    uploadTask.on('state_changed', () => { }, (error) => reject(error),
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve({ type, url: downloadURL });
                        }
                    );
                });
            });

            const uploadedFiles = await Promise.all(uploadPromises);
            const urls = uploadedFiles.reduce((acc, { type, url }) => ({ ...acc, [type]: url }), {});

            await updateProfile(user, { photoURL: urls.profile });

            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                isSellerVerified: true,
                photoURL: urls.profile,
                selfieURL: urls.selfie,
                telefono: telefono,
                sellerProfileCompletedAt: new Date().toISOString(),
            });

            setLoading(false);
            await Swal.fire({
                icon: 'success',
                title: '¡Verificación Completa!',
                text: 'Tu perfil de vendedor ha sido creado. Ya puedes empezar a vender.',
                timer: 2500,
                showConfirmButton: false,
                timerProgressBar: true,
            });
            router.push('/app/pages/Profile_Ventas');
            router.refresh();

        } catch (error) {
            console.error("Error en la verificación:", error);
            setLoading(false);
            Swal.fire('Error', 'Ocurrió un problema al subir tus datos. Inténtalo de nuevo.', 'error');
        }
    };

    return (
        <>
            <CameraModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={(file) => handleFileSelect(file, 'selfie')}
            />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Conviértete en Vendedor</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Completa tus datos para verificar tu identidad y empezar a vender.</p>
                    </div>

                    <div className="mb-8 max-w-sm mx-auto">
                        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tu número de WhatsApp</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="text-gray-400" size={20} />
                            </div>
                            <input
                                type="number"
                                id="telefono"
                                name="telefono"
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-gray-900 dark:text-gray-100"
                                placeholder="Ej: 71234567"
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Este número será visible para los compradores interesados en tus productos.</p>
                    </div>


                    <div className="text-center mb-8">
                        <div className="mt-4 max-w-2xl mx-auto text-sm text-blue-800 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 p-4 rounded-lg">
                            <strong>¿Por qué pedimos una selfie?</strong> Para garantizar la seguridad de nuestra comunidad, usamos tu selfie para confirmar que la persona en la foto de perfil es realmente tú. Tu selfie no será pública y solo se usará para esta verificación.
                        </div>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <ImageUploadField
                            id="profile"
                            label="Tu Foto de Perfil"
                            description="Esta será tu imagen pública. Elige una foto clara."
                            icon={<User size={40} />}
                            onFileSelect={(file) => handleFileSelect(file, 'profile')}
                            file={files.profile}
                            preview={previews.profile}
                            showCameraOption={false}
                        />

                        {checkingCamera && (
                            <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 h-full flex flex-col justify-center items-center">
                                <p className="text-gray-500 dark:text-gray-400">Comprobando cámara...</p>
                            </div>
                        )}

                        {!checkingCamera && (
                            <ImageUploadField
                                id="selfie"
                                label="Tu Selfie"
                                description="Debe coincidir con tu foto de perfil."
                                icon={hasCamera ? <Camera size={40} /> : <Upload size={40} />}
                                onFileSelect={(file) => handleFileSelect(file, 'selfie')}
                                onCameraClick={() => setIsCameraOpen(true)}
                                file={files.selfie}
                                preview={previews.selfie}
                                showCameraOption={hasCamera}
                            />
                        )}
                    </div>

                    <div className="text-center">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !files.profile || !files.selfie || !telefono}
                            className="w-full max-w-xs px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verificando...' : 'Finalizar Verificación'}
                        </button>
                        {loading && <p className="text-sm mt-4 text-gray-600 dark:text-gray-400">Subiendo datos, por favor espera...</p>}
                    </div>
                </div>
            </div>
        </>
    );
}
