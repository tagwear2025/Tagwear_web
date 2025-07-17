// src/app/api/users/update-document-image/route.js
import { NextResponse } from 'next/server';
// Importamos 'db' y 'storage' de tu archivo de configuración de administrador
import { db, storage } from '@/lib/firebase-admin'; 
import { FieldValue } from 'firebase-admin/firestore';

// --- ¡NUEVO! Función para borrar la imagen anterior de forma segura ---
async function deleteOldImage(imageUrl) {
  // Si no hay URL anterior o no es una URL de Firebase Storage, no hacemos nada.
  if (!imageUrl || !imageUrl.startsWith('https://firebasestorage.googleapis.com/')) {
    console.log("No old image URL provided or not a Firebase URL, skipping deletion.");
    return;
  }
  try {
    // Obtenemos la referencia al bucket de almacenamiento por defecto
    const bucket = storage.bucket();
    // Extraemos la ruta del archivo de la URL completa
    const filePath = decodeURIComponent(imageUrl.split('/o/')[1].split('?')[0]);
    // Creamos una referencia al archivo
    const fileRef = bucket.file(filePath);
    await fileRef.delete();
    console.log(`Successfully deleted old image: ${filePath}`);
  } catch (error) {
    // Si el archivo no existe (código 404), no es un error crítico.
    if (error.code === 404) {
      console.warn(`Old image not found, skipping deletion: ${imageUrl}`);
    } else {
      // Para otros errores, los registramos pero no rompemos la operación principal.
      console.error(`Failed to delete old image: ${imageUrl}`, error);
    }
  }
}

export async function POST(request) {
  try {
    // Ahora recibimos la URL antigua para poder borrarla.
    const { userId, docType, newImageUrl, oldImageUrl } = await request.json();

    if (!userId || !docType || !newImageUrl) {
      return NextResponse.json({ error: 'Faltan datos requeridos.' }, { status: 400 });
    }

    const userDocRef = db.collection('users').doc(userId);
    const docSnap = await userDocRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    const userData = docSnap.data();
    const updatePayload = {};

    // --- LÓGICA DE COOLDOWN ACTUALIZADA A 5 DÍAS ---
    if (docType === 'idCard' || docType === 'license') {
      const lastUpdate = userData.documentsLastUpdatedAt;
      if (lastUpdate && typeof lastUpdate.toMillis === 'function') {
        const fiveDaysInMillis = 5 * 24 * 60 * 60 * 1000; // 5 días
        if (Date.now() - lastUpdate.toMillis() < fiveDaysInMillis) {
          const timeLeft = fiveDaysInMillis - (Date.now() - lastUpdate.toMillis());
          const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
          return NextResponse.json({ error: `Debes esperar aproximadamente ${daysLeft} día(s) para volver a editar.` }, { status: 429 });
        }
      }
      updatePayload.documentsLastUpdatedAt = FieldValue.serverTimestamp();
    }

    // Lógica de actualización de URL
    const urlField = docType === 'profile' ? 'photoURL' : `${docType}URL`;
    updatePayload[urlField] = newImageUrl;
    
    // Actualizamos el documento en Firestore
    await userDocRef.update(updatePayload);

    // --- ¡NUEVO! Borramos la imagen antigua DESPUÉS de actualizar la base de datos ---
    await deleteOldImage(oldImageUrl);
    
    return NextResponse.json({ message: 'Documento actualizado exitosamente' }, { status: 200 });

  } catch (error) {
    console.error('ERROR DETALLADO en update-document-image:', error);
    return NextResponse.json({ error: 'Error interno del servidor al actualizar la imagen.' }, { status: 500 });
  }
}
