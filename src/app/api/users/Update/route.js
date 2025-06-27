// src/app/api/users/update/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function POST(req) {
  try {
    const { userId, ...userData } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID es requerido' }, { status: 400 });
    }

    // Referencia al documento del usuario en Firestore
    const userRef = db.collection('users').doc(userId);

    // Actualiza el documento con los nuevos datos
    await userRef.update(userData);

    return NextResponse.json({ message: 'Usuario actualizado correctamente' }, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    return NextResponse.json({ error: 'No se pudo actualizar el usuario', details: error.message }, { status: 500 });
  }
}
