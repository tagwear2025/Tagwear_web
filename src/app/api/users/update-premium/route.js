// src/app/api/users/update-premium/route.js
import { NextResponse } from 'next/server';
// CORRECCIÓN: Tu código usa el SDK de Admin, lo cual es correcto para el backend.
import { db } from '@/lib/firebase-admin'; 
// El Admin SDK usa su propio Timestamp, no el del cliente.
import { FieldValue } from 'firebase-admin/firestore'; 

export async function POST(request) {
  // ADAPTACIÓN: Usamos los nombres de campos de tu modelo de datos.
  const { userId, fechaSuscripcion, fechaVencimiento } = await request.json(); 

  if (!userId || !fechaSuscripcion || !fechaVencimiento) {
    return NextResponse.json({ error: 'Faltan datos para actualizar premium.' }, { status: 400 });
  }

  try {
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.update({
      // Convertimos las fechas string a Timestamps de Firestore antes de guardar
      fechaSuscripcion: new Date(fechaSuscripcion),
      fechaVencimiento: new Date(fechaVencimiento),
    });
    return NextResponse.json({ message: 'Suscripción premium actualizada.' }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar premium:", error);
    return NextResponse.json({ error: 'Error al actualizar la suscripción.' }, { status: 500 });
  }
}