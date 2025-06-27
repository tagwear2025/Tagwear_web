// src/app/api/users/delete/route.js
import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebaseAdmin';

export async function POST(request) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'Falta el ID del usuario.' }, { status: 400 });
  }

  try {
    // Paso 1: Eliminar el usuario de Firebase Authentication
    await auth.deleteUser(userId);

    // Paso 2: Eliminar el documento del usuario de Firestore
    await db.collection('users').doc(userId).delete();

    return NextResponse.json({ message: 'Usuario eliminado completamente.' }, { status: 200 });
  } catch (error) {
    console.error(`Error al eliminar usuario ${userId}:`, error);
    return NextResponse.json({ error: 'No se pudo eliminar el usuario.' }, { status: 500 });
  }
}