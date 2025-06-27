// src/app/api/users/[userId]/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

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