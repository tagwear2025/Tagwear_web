// src/app/api/register/route.js
import { NextResponse } from 'next/server';
// CORRECCIÓN: Tu código usa 'firebaseAdmin', lo mantenemos.
import { auth, db } from '@/lib/firebaseAdmin';

export async function POST(request) {
  try {
    const {
      nombres,
      apellidos,
      fechaNacimiento,
      sexo,
      lugarResidencia,
      email,
      password,
    } = await request.json();

    if (!email || !password || !nombres || !apellidos) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
    }
    
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${nombres} ${apellidos}`,
    });
    
    await auth.setCustomUserClaims(userRecord.uid, { role: 'user' });

    // Usamos el estilo de tu código para interactuar con Firestore
    await db.collection('users').doc(userRecord.uid).set({
      nombres,
      apellidos,
      email,
      fechaNacimiento,
      sexo,
      lugarResidencia,
      rol: 'user',
      // Tu campo para el estado de la cuenta. Correcto.
      active: true, 
      createdAt: new Date().toISOString(),
      // --- NUEVOS CAMPOS AÑADIDOS ---
      // Usamos los nombres de campos que ya existen en tu modelo de ejemplo.
      fechaSuscripcion: null,
      fechaVencimiento: null,
    });

    return NextResponse.json(
      { message: 'Usuario creado exitosamente.' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error en /api/register:', error);
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Este correo electrónico ya está en uso.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'No se pudo crear el usuario.' }, { status: 500 });
  }
}