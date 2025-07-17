// src/app/api/register/route.js
import { NextResponse } from 'next/server';
// Usamos la importación de tu archivo original para mantener la consistencia
import { auth as adminAuth, db as adminDb } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    // 1. Desestructuramos los datos como en tu API original
    const {
      nombres,
      apellidos,
      fechaNacimiento,
      sexo,
      lugarResidencia,
      email,
      password,
      estadoCuenta, // Este campo venía en tu formulario
    } = await request.json();

    // Verificación de campos requeridos
    if (!email || !password || !nombres || !apellidos) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
    }
    
    // 2. Creamos el usuario en Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${nombres} ${apellidos}`,
    });
    
    // 3. Asignamos el rol como lo hacías antes
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'user' });

    // 4. Creamos el documento en Firestore combinando tu estructura con el nuevo campo
    await adminDb.collection('users').doc(userRecord.uid).set({
      nombres,
      apellidos,
      email,
      fechaNacimiento,
      sexo,
      lugarResidencia,
      rol: 'user',
      active: estadoCuenta || true, // Usamos tu campo o un valor por defecto
      createdAt: new Date().toISOString(),
      
      // --- CAMPO CLAVE AÑADIDO ---
      // Aquí está la adición importante para la lógica de vendedor.
      isSellerVerified: false, 
      
      // Campos adicionales de tu modelo original
      fechaSuscripcion: null,
      fechaVencimiento: null,
      photoURL: null, // Inicializamos los campos de URL como nulos
      idCardURL: null,
      licenseURL: null,
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
