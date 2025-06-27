// src/app/api/users/clear-premium/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function POST(request) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'Falta el ID del usuario.' }, { status: 400 });
  }

  try {
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.update({
      fechaSuscripcion: null,
      fechaVencimiento: null,
    });
    return NextResponse.json({ message: 'Suscripción premium eliminada.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar la suscripción.' }, { status: 500 });
  }
}