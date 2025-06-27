'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Swal from 'sweetalert2';
import { useTheme } from '@/context/ThemeContext'; // 1. Importar el hook

export default function AdminSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true); // Estado de carga añadido
  const { isDark, isLoaded } = useTheme(); // 2. Obtener el estado del tema

  // 3. Definir estilos para SweetAlert2
  const swalTheme = {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
  };

  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'solicitudes'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSolicitudes(data);
      } catch (error) {
        console.error("Error fetching solicitudes:", error);
      } finally {
        setLoading(false); // Termina la carga
      }
    };

    fetchSolicitudes();
  }, []);

  const handleRecibirPago = async (solicitud) => {
    const confirm = await Swal.fire({
      title: '¿Recibiste el pago?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
      ...swalTheme,
    });

    if (confirm.isConfirmed) {
      try {
        const userRef = doc(db, 'users', solicitud.userId);
        await updateDoc(userRef, {
          cursosPagados: arrayUnion({
            idCurso: solicitud.courseId,
            fechaExamen: solicitud.examDate,
            nota: null,
          }),
        });
        await deleteDoc(doc(db, 'solicitudes', solicitud.id));
        setSolicitudes(solicitudes.filter(s => s.id !== solicitud.id));
        Swal.fire({ title: 'Listo', text: 'El curso ha sido asignado al usuario.', icon: 'success', ...swalTheme });
      } catch (error) {
        Swal.fire({ title: 'Error', text: 'No se pudo asignar el curso.', icon: 'error', ...swalTheme });
      }
    }
  };

  const handleNoPago = async (solicitud) => {
    const result = await Swal.fire({
      title: '¿Qué quieres hacer?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Borrar solicitud',
      cancelButtonText: 'Cancelar',
      ...swalTheme,
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'solicitudes', solicitud.id));
        setSolicitudes(solicitudes.filter(s => s.id !== solicitud.id));
        Swal.fire({ title: 'Eliminado', text: 'La solicitud ha sido eliminada.', icon: 'success', ...swalTheme });
      } catch (error) {
        Swal.fire({ title: 'Error', text: 'No se pudo eliminar la solicitud.', icon: 'error', ...swalTheme });
      }
    }
  };

  // 4. Estilos reutilizables para la UI
  const cardStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    borderColor: isDark ? '#374151' : '#e5e7eb'
  };
  const labelStyle = { color: isDark ? '#f9fafb' : '#111827' };
  const valueStyle = { color: isDark ? '#d1d5db' : '#6b7280' };

  if (loading || !isLoaded) {
    return (
      <section style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }} className="p-8 min-h-screen text-center">
        <p style={{ color: isDark ? '#f9fafb' : '#111827' }} className="animate-pulse">Cargando solicitudes...</p>
      </section>
    );
  }

  return (
    <div 
      className="p-4 md:p-6 min-h-screen"
      style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
    >
      <div className="max-w-7xl mx-auto">
        <h1 
          className="text-3xl font-bold mb-6"
          style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}
        >
          Solicitudes Pendientes
        </h1>
        <div className="grid grid-cols-1 gap-4">
          {solicitudes.length === 0 && (
            <p style={valueStyle}>No hay solicitudes pendientes.</p>
          )}

          {solicitudes.map(solicitud => (
            <div 
              key={solicitud.id} 
              className="p-5 rounded-lg shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border"
              style={cardStyle}
            >
              <div className="space-y-1">
                <p style={valueStyle}><strong style={labelStyle}>Usuario:</strong> {solicitud.userName}</p>
                <p style={valueStyle}><strong style={labelStyle}>Correo:</strong> {solicitud.userEmail}</p>
                <p style={valueStyle}><strong style={labelStyle}>Curso:</strong> {solicitud.courseName}</p>
                <p style={valueStyle}><strong style={labelStyle}>Fecha de Examen:</strong> {solicitud.examDate}</p>
                <p style={valueStyle}><strong style={labelStyle}>Estado:</strong> {solicitud.status}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <a
                  href={`https://api.whatsapp.com/send?phone=591${solicitud.userPhone || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>
                  WhatsApp
                </a>
                <button onClick={() => handleRecibirPago(solicitud)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">Recibí el pago</button>
                <button onClick={() => handleNoPago(solicitud)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition">No se realizó el pago</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}