// 2. Crea este archivo en: src/app/components/marketplace/ImageUploader.jsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UploadCloud, FileImage, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImageUploader({ onUploadComplete }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setError('Por favor, selecciona un archivo de imagen válido.');
      setFile(null);
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user || !title) {
      setError('Por favor, selecciona una imagen y añade un título.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    const storageRef = ref(storage, `products/${user.uid}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(prog);
      },
      (err) => {
        console.error(err);
        setError('Ocurrió un error al subir la imagen. Inténtalo de nuevo.');
        setUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, 'products'), {
            title,
            description,
            imageUrl: downloadURL,
            createdBy: user.uid,
            authorName: user.displayName || user.email,
            authorPhotoURL: user.photoURL || '',
            createdAt: serverTimestamp(),
          });
          setSuccess(true);
          setUploading(false);
          setTimeout(() => {
            onUploadComplete();
            resetForm();
          }, 1500);
        } catch (dbError) {
          console.error(dbError);
          setError('Error al guardar los datos del Pin.');
          setUploading(false);
        }
      }
    );
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setTitle('');
    setDescription('');
    setProgress(0);
    setSuccess(false);
    setError(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-full flex flex-col justify-center items-center border-2 border-dashed border-gray-300 dark:border-gray-600">
        {preview ? (
          <img src={preview} alt="Vista previa" className="max-h-96 w-auto object-contain rounded-md" />
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <UploadCloud size={64} className="mx-auto mb-4" />
            <p className="font-semibold">Arrastra y suelta tu imagen aquí</p>
            <p className="text-sm">o</p>
            <label htmlFor="file-upload" className="cursor-pointer text-blue-500 hover:underline font-medium">
              Selecciona un archivo
            </label>
            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {file && (
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <FileImage className="text-blue-500" />
                <span className="text-sm font-medium truncate">{file.name}</span>
            </div>
        )}
        <input
          type="text"
          placeholder="Añade un título *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-transparent focus:border-blue-500 focus:ring-0 transition"
        />
        <textarea
          placeholder="Cuenta un poco más sobre tu Pin..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="4"
          className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-transparent focus:border-blue-500 focus:ring-0 transition"
        />
        
        {uploading && (
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm flex items-center gap-2"><AlertCircle size={16}/> {error}</p>}
        {success && <p className="text-green-500 text-sm flex items-center gap-2"><CheckCircle size={16}/> ¡Pin creado con éxito!</p>}

        <button
          onClick={handleUpload}
          disabled={uploading || !file || !title}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? `Subiendo... ${progress}%` : 'Guardar Pin'}
        </button>
      </div>
    </div>
  );
}