// src/app/api/register/route.js
import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebaseAdmin';

export async function POST(request) {
  try {
    // 1. Extraer los datos del cuerpo de la solicitud
    const {
      nombres,
      apellidos,
      fechaNacimiento,
      sexo,
      lugarResidencia,
      email,
      password,
      estadoCuenta, // Este valor viene del frontend como `true`
    } = await request.json();

    // 2. Validación de campos en el backend (una capa extra de seguridad)
    if (!email || !password || !nombres || !apellidos || !fechaNacimiento || !sexo || !lugarResidencia) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
        return NextResponse.json(
            { error: 'La contraseña debe tener al menos 6 caracteres.' },
            { status: 400 }
        );
    }

    // 3. Crear el usuario en Firebase Authentication
    // El displayName combina nombres y apellidos para una mejor visualización en Firebase
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${nombres} ${apellidos}`,
    });
    
    // 4. Establecer un rol personalizado para el usuario.
    // Esto es más seguro y escalable que depender del email.
    await auth.setCustomUserClaims(userRecord.uid, { role: 'user' });

    // 5. Crear el documento del usuario en Firestore con la estructura de datos correcta
    await db.collection('users').doc(userRecord.uid).set({
      nombres,
      apellidos,
      email,
      fechaNacimiento,
      sexo,
      lugarResidencia,
      rol: 'user', // Asignar rol explícitamente en la base de datos
      // ===================================================================
      // CORRECCIÓN APLICADA: Se usa 'active' para alinear con la API de login.
      active: estadoCuenta, 
      // ===================================================================
      createdAt: new Date().toISOString(),
      // Puedes añadir otros campos por defecto si es necesario
      // por ejemplo: fotoURL: 'url/a/imagen/por/defecto.png'
    });

    console.log(`Usuario creado y activado exitosamente: ${email} con UID: ${userRecord.uid}`);
    
    // 6. Enviar una respuesta de éxito
    return NextResponse.json(
      { message: 'Usuario creado exitosamente.' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error en /api/register:', error);

    // 7. Manejo de errores específicos de Firebase
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'Este correo electrónico ya está en uso. Por favor, utiliza otro.' },
        { status: 409 } // 409 Conflict
      );
    }
    
    if (error.code === 'auth/invalid-email') {
        return NextResponse.json(
          { error: 'El formato del correo electrónico no es válido.' },
          { status: 400 }
        );
    }

    // Error genérico para otros casos
    return NextResponse.json(
      { error: 'No se pudo crear el usuario. Inténtalo más tarde.' },
      { status: 500 }
    );
  }
}