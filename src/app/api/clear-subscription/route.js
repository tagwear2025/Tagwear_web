// src/app/api/clear-subscription/route.js
import { NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'UserId es requerido' }, { status: 400 });
    }

    const userRef = admin.firestore().collection('users').doc(userId);
    await userRef.update({
      fechaSuscripcion: '-',
      fechaVencimiento: '-',
      isPremium: false,
    });

    return NextResponse.json({ message: 'Suscripción eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar suscripción:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}