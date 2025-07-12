'use client';

import { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { UploadCloud, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

// ✅ AÑADIDO: Se pasa `maxFiles` como prop para que el componente controle su propio límite.
export default function ImageUploader({ files, setFiles, maxFiles = 5 }) {

  const onDrop = useCallback((acceptedFiles) => {
    // Verificar si al añadir los nuevos archivos se excede el límite
    if (files.length + acceptedFiles.length > maxFiles) {
      toast.error(`No puedes subir más de ${maxFiles} imágenes.`);
      return;
    }

    // Procesar los archivos aceptados, añadiendo una URL de previsualización
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    
    setFiles(prev => [...prev, ...newFiles]);

  }, [files, setFiles, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    // ✅ CORRECCIÓN: El componente ahora se deshabilita si se alcanza el límite
    disabled: files.length >= maxFiles,
  });

  const removeFile = (fileToRemove) => {
    // Usamos el objeto de archivo completo para asegurar que borramos el correcto
    setFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  // Limpiar los object URLs para evitar fugas de memoria
  useEffect(() => {
    return () => files.forEach(file => URL.revokeObjectURL(file.preview));
  }, [files]);

  // ✅ CORRECCIÓN: Se usa el índice en la key para garantizar que sea única y evitar el error de la consola.
  const thumbs = files.map((file, index) => (
    <div key={`${file.name}-${index}`} className="relative w-24 h-24 border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden group">
      <Image
        src={file.preview}
        alt={file.name}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
      />
      <button
        type="button"
        onClick={() => removeFile(file)}
        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
        className={`p-6 border-2 border-dashed rounded-lg text-center transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-gray-300 dark:border-gray-600'}
          ${files.length >= maxFiles ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800 opacity-60' : 'cursor-pointer hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
          <UploadCloud size={40} />
          {files.length < maxFiles ? (
            <>
              <p className="font-semibold">Arrastra tus imágenes o haz clic aquí</p>
              <p className="text-xs">Máximo {maxFiles} imágenes (hasta 5MB cada una)</p>
            </>
          ) : (
            <p className="font-semibold">Has alcanzado el límite de {maxFiles} imágenes</p>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {thumbs}
        </div>
      )}
    </div>
  );
}
