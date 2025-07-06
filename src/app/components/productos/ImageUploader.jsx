'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, AlertCircle } from 'lucide-react';
import Image from 'next/image';

// Componente para gestionar la subida y previsualización de imágenes
export default function ImageUploader({ files, setFiles }) {
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');
    
    // Validar archivos aceptados
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));

    if (files.length + newFiles.length > 5) {
        setError('No puedes subir más de 5 imágenes por producto.');
        return;
    }

    setFiles(prevFiles => [...prevFiles, ...newFiles]);

    // Manejar archivos rechazados
    if (rejectedFiles.length > 0) {
      setError('Algunos archivos fueron rechazados. Asegúrate que son imágenes (jpeg, png) y pesan menos de 5MB.');
    }
  }, [files, setFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true
  });

  const removeFile = (fileName) => {
    setFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };

  const thumbs = files.map(file => (
    <div key={file.name} className="relative w-24 h-24 border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden group">
      <Image
        src={file.preview}
        alt={file.name}
        width={96}
        height={96}
        className="object-cover w-full h-full"
        onLoad={() => { URL.revokeObjectURL(file.preview) }} // Libera memoria
      />
      <button
        type="button"
        onClick={() => removeFile(file.name)}
        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove image"
      >
        <X size={16} />
      </button>
    </div>
  ));

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
          <UploadCloud size={40} />
          {isDragActive ? (
            <p>Suelta las imágenes aquí...</p>
          ) : (
            <p>Arrastra y suelta tus imágenes aquí, o haz clic para seleccionarlas</p>
          )}
          <p className="text-xs">PNG, JPG hasta 5MB. Máximo 5 imágenes.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {thumbs}
        </div>
      )}
    </div>
  );
}
