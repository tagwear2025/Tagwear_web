'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast, Toaster } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';
import { QrCode, Phone, Save, Loader, AlertCircle } from 'lucide-react';
import Image from 'next/image';

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
  
  // ✨ FUNCIÓN PARA CONVERTIR URLS DE GOOGLE DRIVE
  const convertGoogleDriveUrl = (url) => {
    if (url.includes('drive.google.com/file/d/')) {
      try {
        const id = url.split('/d/')[1].split('/')[0];
        return `https://drive.google.com/uc?export=view&id=${id}`;
      } catch {
        return url; // Si falla la conversión, devolver la URL original
      }
    }
    return url;
  };
  
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
          // ✨ CONVERTIR URL AL CARGAR DATOS INICIALES
          const convertedUrl = data.qrImageUrl ? convertGoogleDriveUrl(data.qrImageUrl) : '';
          setPrevisualizacion(convertedUrl);
        }
      } catch (error) {
        toast.error('Error al cargar la información de contacto.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [isLoaded]); // Dependencia solo de isLoaded para que se ejecute una vez

  // ✨ LÓGICA DE VALIDACIÓN MEJORADA CON CONVERSIÓN DE DRIVE
  const validarYPrevisualizar = useCallback(async (link) => {
    if (!link || !link.startsWith('http')) {
        setPrevisualizacion('');
        setErrorValidacion('');
        return;
    }
    
    setValidando(true);
    setErrorValidacion('');
    
    try {
      // ✨ CONVERTIR URL DE GOOGLE DRIVE ANTES DE VALIDAR
      const convertedUrl = convertGoogleDriveUrl(link);
      
      // Intentar validar la imagen
      const res = await fetch(convertedUrl, { method: 'HEAD' });
      const contentType = res.headers.get('content-type');
      
      if (res.ok && contentType?.startsWith('image')) {
        setPrevisualizacion(convertedUrl);
      } else {
        // Si falla la validación HEAD, pero es una URL de Drive convertida, intentar mostrarla de todos modos
        if (link.includes('drive.google.com')) {
          setPrevisualizacion(convertedUrl);
          setErrorValidacion(''); // No mostrar error para URLs de Drive
        } else {
          setPrevisualizacion('');
          setErrorValidacion('El enlace no es una imagen válida (JPG, PNG, etc).');
        }
      }
    } catch (err) {
      // Si es una URL de Google Drive, mostrar la previsualización aunque falle la validación
      if (link.includes('drive.google.com')) {
        const convertedUrl = convertGoogleDriveUrl(link);
        setPrevisualizacion(convertedUrl);
        setErrorValidacion(''); // No mostrar error para URLs de Drive
      } else {
        setPrevisualizacion('');
        setErrorValidacion('No se pudo acceder al enlace. Verifica que sea correcto y público.');
      }
    }
    setValidando(false);
  }, []);

  // ✨ MANEJO DE CAMBIO DE LINK CON DEBOUNCE MEJORADO
  const manejarCambioLink = (e) => {
    const valor = e.target.value;
    setNewQrLink(valor);
    
    // Limpiar el timeout anterior si existe
    if (manejarCambioLink.timeoutId) {
      clearTimeout(manejarCambioLink.timeoutId);
    }
    
    // Usamos un temporizador (debounce) para no validar en cada tecla
    manejarCambioLink.timeoutId = setTimeout(() => {
      validarYPrevisualizar(valor);
    }, 500); // Espera 500ms después de que el usuario deja de escribir
  };

  const handleSaveChanges = async () => {
    if (!newPhone) {
      toast.error('El número de teléfono es obligatorio.');
      return;
    }
    
    if (newQrLink && !previsualizacion) {
      toast.error('Por favor, proporciona un enlace válido para el nuevo QR.');
      return;
    }
    
    const loadingToast = toast.loading('Guardando cambios...');
    
    try {
      // ✨ GUARDAR LA URL CONVERTIDA (SI EXISTE PREVISUALIZACIÓN)
      const dataToUpdate = {
        adminWhatsapp: newPhone
      };
      
      // Solo actualizar la URL del QR si hay una previsualización válida
      if (previsualizacion) {
        dataToUpdate.qrImageUrl = previsualizacion; // Guardamos la URL convertida
      }
      
      await setDoc(configRef, dataToUpdate, { merge: true });
      toast.success('Información de contacto actualizada.', { id: loadingToast });
    } catch (err) {
      console.error('Error al guardar:', err);
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
      <Toaster position="top-right" toastOptions={{ className: isDark ? 'bg-gray-700 text-white' : '' }} />
      <h1 className="text-2xl font-bold mb-6 text-blue-500">Información de Contacto y Pago</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Esta información se mostrará a los vendedores cuando soliciten un producto premium.
      </p>

      <div className="space-y-6">
        <div>
          <label htmlFor="telefono" className="block font-medium mb-2 flex items-center gap-2">
            <Phone size={18}/> Número de WhatsApp del Admin
          </label>
          <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Este número se usará para que los usuarios te contacten. Incluye el código de país (ej: +591XXXXXXXX).
          </p>
          <input
            id="telefono" 
            type="text" 
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            style={inputStyle} 
            placeholder="+59168706660"
          />
        </div>
        
        <div>
          <label htmlFor="qr-link" className="block font-medium mb-2 flex items-center gap-2">
            <QrCode size={18}/> Enlace de la Imagen del QR
          </label>
          <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Puedes usar enlaces directos de imágenes o enlaces de Google Drive.
          </p>
          <input
            id="qr-link" 
            type="text" 
            value={newQrLink}
            onChange={manejarCambioLink}
            className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            style={inputStyle} 
            placeholder="https://drive.google.com/file/d/... o https://ejemplo.com/imagen.png"
          />
        </div>
      </div>

      <div className="mt-6 min-h-[200px]">
        <p className="text-sm mb-2 text-gray-600 dark:text-gray-300">Previsualización del QR:</p>
        {validando ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader className="animate-spin" size={20}/> Validando...
            </div>
        ) : previsualizacion ? (
            <div className="relative">
              {/* ✨ USAR EL COMPONENTE IMAGE DE NEXT.JS */}
              <Image 
                src={previsualizacion} 
                alt="Previsualización QR" 
                width={192} 
                height={192}
                className="rounded-lg border-2" 
                style={{ borderColor: isDark ? '#4b5563' : '#d1d5db' }}
                onError={() => {
                  // Si la imagen falla al cargar, mostrar error
                  setErrorValidacion('Error al cargar la imagen. Verifica que el enlace sea válido y público.');
                  setPrevisualizacion('');
                }}
              />
            </div>
        ) : (
            <div 
              className="w-48 h-48 border-4 border-dashed rounded-lg flex items-center justify-center text-center text-gray-400" 
              style={{ borderColor: inputStyle.borderColor }}
            >
                {errorValidacion ? 
                    <span className="text-red-500 text-sm p-2 flex items-center gap-2">
                      <AlertCircle size={20}/> {errorValidacion}
                    </span> : 
                    <span>Pega un enlace de imagen válido</span>
                }
            </div>
        )}
      </div>

      <div className="mt-8 text-right">
        <button
          onClick={handleSaveChanges}
          disabled={!newPhone || (newQrLink && !previsualizacion)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2 float-right disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save size={20}/> Guardar Cambios
        </button>
      </div>
    </div>
  );
}