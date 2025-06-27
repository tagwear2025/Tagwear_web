'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast, Toaster } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext'; // 1. Importar el hook

export default function QRGestionPage() {
  const [qrActual, setQrActual] = useState('');
  const [nuevoLink, setNuevoLink] = useState('');
  const [previsualizacion, setPrevisualizacion] = useState('');
  const [validando, setValidando] = useState(false);
  const { isDark, isLoaded } = useTheme(); // 2. Obtener el estado del tema

  const docRef = doc(db, 'pags', 'qr');

  // 3. Estilos reutilizables para la UI basados en el tema
  const containerStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff', // Darker background for dark mode
    borderColor: isDark ? '#374151' : '#e5e7eb', // Border color
    color: isDark ? '#f9fafb' : '#111827', // Default text color
  };
  const titleStyle = {
    color: isDark ? '#60a5fa' : '#3b82f6', // Blue for titles
  };
  const subtitleStyle = {
    color: isDark ? '#f9fafb' : '#111827', // Stronger color for subtitles
  };
  const paragraphStyle = {
    color: isDark ? '#d1d5db' : '#6b7280', // Lighter grey for general text
  };
  const labelStyle = {
    color: isDark ? '#f9fafb' : '#111827', // Label text color
  };
  const inputStyle = {
    backgroundColor: isDark ? '#374151' : '#ffffff', // Input background
    color: isDark ? '#f9fafb' : '#111827', // Input text color
    borderColor: isDark ? '#4b5563' : '#d1d5db', // Input border
    // Tailwind classes for focus ring are already applied
  };
  const buttonEnabledStyle = {
    backgroundColor: isDark ? '#3b82f6' : '#3b82f6', // Blue for enabled button
    color: '#ffffff',
  };
  const buttonDisabledStyle = {
    backgroundColor: isDark ? '#4b5563' : '#d1d5db', // Grey for disabled button
    color: isDark ? '#9ca3af' : '#9ca3af',
  };

  useEffect(() => {
    const cargarQR = async () => {
      // Ensure theme is loaded before fetching data if it impacts initial render
      if (!isLoaded) return;
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setQrActual(docSnap.data().url);
        }
      } catch (error) {
        console.error("Error cargando QR:", error);
        toast.error('Error al cargar el QR actual.');
      }
    };
    cargarQR();
  }, [docRef, isLoaded]); // Add docRef to dependencies for useEffect clean-up.

  const validarYPrevisualizar = async (link) => {
    setPrevisualizacion('');
    setValidando(true);

    try {
      const res = await fetch(link, { method: 'HEAD' });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType?.startsWith('image')) {
        setPrevisualizacion(link);
      } else {
        toast.error('El enlace no es válido o no es una imagen.');
      }
    } catch (err) {
      toast.error('No se pudo validar el enlace.');
    }

    setValidando(false);
  };

  const manejarCambioLink = (e) => {
    const valor = e.target.value;
    setNuevoLink(valor);
    if (valor.startsWith('http')) {
      validarYPrevisualizar(valor);
    } else {
      setPrevisualizacion('');
    }
  };

  const actualizarQR = async () => {
    if (!previsualizacion) {
      toast.error('No puedes guardar un enlace inválido.');
      return;
    }

    try {
      await setDoc(docRef, { url: previsualizacion });
      setQrActual(previsualizacion);
      setNuevoLink('');
      setPrevisualizacion('');
      toast.success('QR actualizado correctamente.');
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar el QR.');
    }
  };

  // Show a loading message if theme is not yet loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
        <p className="animate-pulse" style={{ color: isDark ? '#f9fafb' : '#111827' }}>Cargando gestión QR...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 rounded-xl shadow-md mt-10 border" style={containerStyle}>
      <h1 className="text-2xl font-bold mb-4" style={titleStyle}>Gestión de Código QR</h1>

      <div className="mb-4">
        <h2 className="font-semibold mb-2" style={subtitleStyle}>QR Actual:</h2>
        {qrActual ? (
          <img src={qrActual} alt="QR Actual" className="w-48 h-auto rounded border" style={{ borderColor: isDark ? '#4b5563' : '#d1d5db' }} />
        ) : (
          <p style={paragraphStyle}>No se ha establecido aún.</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="nuevo" className="block font-medium mb-1" style={labelStyle}>
          Nuevo enlace de imagen QR:
        </label>
        <input
          id="nuevo"
          type="text"
          value={nuevoLink}
          onChange={manejarCambioLink}
          className="w-full rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500 transition"
          style={inputStyle}
          placeholder="https://..."
        />
      </div>

      {validando && <p className="text-sm" style={paragraphStyle}>Validando enlace...</p>}

      {previsualizacion && (
        <div className="mb-4">
          <p className="text-sm mb-1" style={paragraphStyle}>Previsualización:</p>
          <img src={previsualizacion} alt="Previsualización" className="w-48 h-auto border rounded" style={{ borderColor: isDark ? '#4b5563' : '#d1d5db' }} />
        </div>
      )}

      <button
        disabled={!previsualizacion}
        onClick={actualizarQR}
        className="text-white px-4 py-2 rounded transition"
        style={!previsualizacion ? buttonDisabledStyle : buttonEnabledStyle}
      >
        Actualizar QR
      </button>

      {/* react-hot-toast maneja sus propios estilos de tema, pero puedes customizarlos si es necesario */}
      <Toaster position="top-right" />
    </div>
  );
}
