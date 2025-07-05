// src/app/api/users/[userId]/route.js
import { NextResponse } from 'next/server';
// Usamos la importación de tu archivo para mantener consistencia
import { db } from '@/lib/firebaseAdmin'; 

// --- TU FUNCIÓN GET (SIN CAMBIOS) ---
// El segundo parámetro 'context' contiene los params de la URL dinámica
export async function GET(request, context) {
  const { userId } = context.params;

  if (!userId) {
    return NextResponse.json({ error: 'Falta el ID del usuario.' }, { status: 400 });
  }

  try {
    const userDocRef = db.collection('users').doc(userId);
    const docSnap = await userDocRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    const userData = docSnap.data();
    // No necesitamos formatear fechas aquí, el frontend se encargará
    return NextResponse.json({ id: docSnap.id, ...userData }, { status: 200 });

  } catch (error) {
    console.error(`Error al obtener usuario ${userId}:`, error);
    return NextResponse.json({ error: 'Error al obtener datos del usuario.' }, { status: 500 });
  }
}


// --- NUEVA FUNCIÓN PUT (AÑADIR ESTO) ---
export async function PUT(request, context) {
  const { userId } = context.params;

  if (!userId) {
    return NextResponse.json({ error: 'Falta el ID del usuario.' }, { status: 400 });
  }

  try {
    const updatedData = await request.json();
    
    // Por seguridad, eliminamos campos que un usuario no debería poder modificar él mismo.
    delete updatedData.role;
    delete updatedData.isSellerVerified;
    delete updatedData.email; // El email se maneja de forma especial en Firebase Auth
    delete updatedData.id; // No se debe actualizar el ID del documento

    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.update(updatedData);

    return NextResponse.json({ message: 'Perfil actualizado exitosamente' }, { status: 200 });

  } catch (error) {
    console.error(`Error al actualizar usuario ${userId}:`, error);
    return NextResponse.json({ error: 'Error al actualizar el perfil.' }, { status: 500 });
  }
}