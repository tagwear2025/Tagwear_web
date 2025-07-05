// src/app/app/pages/Profile_Ventas/PerfilCreate/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import Swal from 'sweetalert2';
import { UploadCloud, CheckCircle, AlertCircle, User, CreditCard, Car } from 'lucide-react';

// Componente reutilizable para cada campo de subida de imagen
const ImageUploadField = ({ id, label, icon, onFileSelect, file, preview }) => (
  <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
    <label htmlFor={id} className="cursor-pointer">
      {preview ? (
        <img src={preview} alt={`${label} preview`} className="w-48 h-32 mx-auto rounded-lg object-cover mb-4" />
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 h-32">
          {icon}
          <p className="mt-2 font-semibold">{label}</p>
        </div>
      )}
      <input id={id} type="file" className="hidden" accept="image/*" onChange={(e) => onFileSelect(e.target.files[0])} />
    </label>
    {file && (
      <div className="mt-2 text-sm font-medium text-green-600 flex items-center justify-center gap-2">
        <CheckCircle size={16} />
        <span>{file.name}</span>
      </div>
    )}
  </div>
);


export default function PerfilCreatePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [files, setFiles] = useState({
    profile: null,
    idCard: null,
    license: null,
  });
  const [previews, setPreviews] = useState({
    profile: null,
    idCard: null,
    license: null,
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

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
    if (!files.profile || !files.idCard || !files.license) {
      Swal.fire('Campos Incompletos', 'Por favor, sube las tres imágenes requeridas.', 'warning');
      return;
    }
    setLoading(true);

    try {
      const uploadPromises = Object.entries(files).map(([type, file]) => {
        const storageRef = ref(storage, `verification_docs/${user.uid}/${type}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        return new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              // Podríamos promediar el progreso si quisiéramos una barra total
            },
            (error) => reject(error),
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({ type, url: downloadURL });
            }
          );
        });
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const urls = uploadedFiles.reduce((acc, { type, url }) => ({ ...acc, [type]: url }), {});

      // Actualizar el perfil de Firebase Auth (foto)
      await updateProfile(user, { photoURL: urls.profile });

      // Actualizar el documento en Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        isSellerVerified: true,
        photoURL: urls.profile,
        idCardURL: urls.idCard,
        licenseURL: urls.license,
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
      router.push('/app/pages/Profile_Ventas'); // Redirigir a la vista de vendedor
      router.refresh(); // Forzar la actualización de datos en la página de destino

    } catch (error) {
      console.error("Error en la verificación:", error);
      setLoading(false);
      Swal.fire('Error', 'Ocurrió un problema al subir tus documentos. Inténtalo de nuevo.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Conviértete en Vendedor</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Sube tus documentos para verificar tu identidad y empezar a vender.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ImageUploadField id="profile" label="Tu Foto de Perfil" icon={<User size={40} />} onFileSelect={(file) => handleFileSelect(file, 'profile')} file={files.profile} preview={previews.profile} />
          <ImageUploadField id="idCard" label="Foto de Carnet (CI)" icon={<CreditCard size={40} />} onFileSelect={(file) => handleFileSelect(file, 'idCard')} file={files.idCard} preview={previews.idCard} />
          <ImageUploadField id="license" label="Licencia de Conducir" icon={<Car size={40} />} onFileSelect={(file) => handleFileSelect(file, 'license')} file={files.license} preview={previews.license} />
        </div>

        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full max-w-xs px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-wait"
          >
            {loading ? 'Verificando...' : 'Finalizar Verificación'}
          </button>
          {loading && <p className="text-sm mt-4">Subiendo documentos, por favor espera...</p>}
        </div>
      </div>
    </div>
  );
}
