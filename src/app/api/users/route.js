// src/app/api/users/route.js
import { db } from '@/lib/firebase-admin';

function formatDate(field) {
  if (field && typeof field.toDate === 'function') {
    return field.toDate().toISOString().split('T')[0];
  }
  if (typeof field === 'string') {
    if (field.match(/^\d{4}-\d{2}-\d{2}/)) {
      return field;
    }
  }
  return null;
}

export async function GET() {
  try {
    const snapshot = await db.collection('users').get();

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaSuscripcion: formatDate(doc.data().fechaSuscripcion),
      fechaVencimiento: formatDate(doc.data().fechaVencimiento),
    }));

    return Response.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}