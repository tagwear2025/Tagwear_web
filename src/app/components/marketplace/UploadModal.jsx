// 1. Crea este archivo en: src/app/components/marketplace/UploadModal.jsx
'use client';

import { X } from 'lucide-react';
import ImageUploader from './ImageUploader';

export default function UploadModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md md:max-w-2xl lg:max-w-4xl p-6 md:p-8 relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={24} />
        </button>
        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Crea un nuevo Pin</h2>
            <p className="text-gray-500 dark:text-gray-400">Sube una imagen y compártela con el mundo.</p>
        </div>
        <ImageUploader onUploadComplete={onClose} />
      </div>
    </div>
  );
}