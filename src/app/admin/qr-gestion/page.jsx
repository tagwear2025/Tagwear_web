'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast, Toaster } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';
import { QrCode, Phone, Save, Loader, AlertCircle } from 'lucide-react';

export default function QRGestionPage() {
  // Estados para los inputs del formulario
  const [newPhone, setNewPhone] = useState('');
  const [newQrLink, setNewQrLink] = useState('');
  
  // Estados para la validación y previsualización
  const [previsualizacion, setPrevisualizacion] = useState('');
  const [validando, setValidando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');

  const [loading, setLoading] = useState(true);
  const { isDark, isLoaded } = useTheme();

  const configRef = doc(db, 'config', 'payment');

  const containerStyle = { backgroundColor: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f9fafb' : '#111827' };
  const inputStyle = { backgroundColor: isDark ? '#374151' : '#f9fafb', color: isDark ? '#f9fafb' : '#111827', borderColor: isDark ? '#4b5563' : '#d1d5db' };
  
  // Cargar los datos iniciales desde Firestore
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isLoaded) return;
      try {
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Solo inicializamos los estados del formulario una vez
          setNewPhone(data.adminWhatsapp || '');
          setNewQrLink(data.qrImageUrl || '');
          setPrevisualizacion(data.qrImageUrl || '');
        }
      } catch (error) {
        toast.error('Error al cargar la información de contacto.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [isLoaded]); // Dependencia solo de isLoaded para que se ejecute una vez

  // Lógica de validación del enlace de la imagen
  const validarYPrevisualizar = useCallback(async (link) => {
    if (!link || !link.startsWith('http')) {
        setPrevisualizacion('');
        setErrorValidacion('');
        return;
    }
    setValidando(true);
    setErrorValidacion('');
    try {
      const res = await fetch(link, { method: 'HEAD' });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType?.startsWith('image')) {
        setPrevisualizacion(link);
      } else {
        setPrevisualizacion('');
        setErrorValidacion('El enlace no es una imagen válida (JPG, PNG, etc).');
      }
    } catch (err) {
      setPrevisualizacion('');
      setErrorValidacion('No se pudo acceder al enlace. Verifica que sea correcto y público.');
    }
    setValidando(false);
  }, []);

  const manejarCambioLink = (e) => {
    const valor = e.target.value;
    setNewQrLink(valor);
    // Usamos un temporizador (debounce) para no validar en cada tecla
    const handler = setTimeout(() => {
      validarYPrevisualizar(valor);
    }, 500); // Espera 500ms después de que el usuario deja de escribir
    return () => clearTimeout(handler);
  };

  const handleSaveChanges = async () => {
    if (!previsualizacion || !newPhone) {
      toast.error('El número de teléfono y un enlace de QR válido son obligatorios.');
      return;
    }
    
    const loadingToast = toast.loading('Guardando cambios...');
    try {
      await setDoc(configRef, { 
        qrImageUrl: previsualizacion, // Guardamos el enlace validado
        adminWhatsapp: newPhone
      });
      toast.success('Información de contacto actualizada.', { id: loadingToast });
    } catch (err) {
      toast.error('No se pudieron guardar los cambios.', { id: loadingToast });
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
        <Loader className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 rounded-xl shadow-lg mt-10 border" style={containerStyle}>
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-6 text-blue-500">Información de Contacto y Pago</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Esta información se mostrará a los vendedores cuando soliciten un producto premium.</p>

      <div className="space-y-6">
        <div>
          <label htmlFor="telefono" className="block font-medium mb-2 flex items-center gap-2"><Phone size={18}/> Número de WhatsApp del Admin</label>
          <input
            id="telefono" type="number" value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            style={inputStyle} placeholder="Ej: 71234567"
          />
        </div>
        <div>
          <label htmlFor="qr-link" className="block font-medium mb-2 flex items-center gap-2"><QrCode size={18}/> Enlace de la Imagen del QR</label>
          <input
            id="qr-link" type="text" value={newQrLink}
            onChange={manejarCambioLink}
            className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            style={inputStyle} placeholder="https://..."
          />
        </div>
      </div>

      <div className="mt-6 min-h-[200px]">
        <p className="text-sm mb-2 text-gray-600 dark:text-gray-300">Previsualización del QR:</p>
        {validando ? (
            <div className="flex items-center gap-2 text-gray-500"><Loader className="animate-spin" size={20}/> Validando...</div>
        ) : previsualizacion ? (
            <img src={previsualizacion} alt="Previsualización QR" className="w-48 h-auto border-4 rounded-lg" style={{ borderColor: inputStyle.borderColor }} />
        ) : (
            <div className="w-48 h-48 border-4 border-dashed rounded-lg flex items-center justify-center text-center text-gray-400" style={{ borderColor: inputStyle.borderColor }}>
                {errorValidacion ? 
                    <span className="text-red-500 text-sm p-2 flex items-center gap-2"><AlertCircle size={20}/> {errorValidacion}</span> : 
                    <span>Pega un enlace de imagen válido</span>
                }
            </div>
        )}
      </div>

      <div className="mt-8 text-right">
        <button
          onClick={handleSaveChanges}
          disabled={!previsualizacion || !newPhone}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2 float-right disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save size={20}/> Guardar Cambios
        </button>
      </div>
    </div>
  );
}
