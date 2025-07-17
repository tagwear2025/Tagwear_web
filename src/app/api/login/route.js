// src/app/api/login/route.js
import { NextResponse } from 'next/server';
import { auth as adminAuth, db } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token, true);
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@admin.com'; // Usa variable de entorno o fallback

    let role = 'user'; // Rol por defecto
    let userData = null; // Datos del usuario de Firestore (si no es admin)

    // *** INICIO: Lógica específica para Admin ***
    if (email === adminEmail) {
      console.log(`Login detectado para Admin: ${email}`);
      role = 'admin';
      // Para el admin, no necesitamos verificar Firestore por 'active'
      // Asumimos que el admin siempre está activo si se autentica.
      // También puedes verificar el custom claim si lo configuraste
      if (decodedToken.role === 'admin') {
          console.log("Custom claim 'admin' verificado para el admin.");
      } else {
          console.warn(`Admin ${email} no tiene el custom claim 'role: admin'. Considera ejecutar setAdmin.js.`);
          // Igual le damos rol admin por el email, pero es bueno tener el claim.
      }
    }
    // *** FIN: Lógica específica para Admin ***
    else {
      // *** INICIO: Lógica para usuarios normales ***
      console.log(`Login detectado para Usuario Normal: ${email}`);
      const userDocRef = db.collection('users').doc(uid);
      const userDocSnap = await userDocRef.get();

      if (!userDocSnap.exists) {
        console.warn(`Usuario normal no encontrado en Firestore con UID: ${uid}, Email: ${email}`);
        return NextResponse.json({ error: 'Usuario no encontrado en la base de datos' }, { status: 404 });
      }

      userData = userDocSnap.data();

      // Verificar si el usuario normal está activo
      if (userData.active !== true) {
        console.log(`Intento de login bloqueado para usuario inactivo: ${email} (UID: ${uid})`);
        return NextResponse.json({ error: 'Tu cuenta está inactiva. Contacta al administrador para habilitarla.' }, { status: 403 });
      }

      // Asignar rol basado en Firestore o fallback (aunque el claim es preferible si lo usas para usuarios)
      role = decodedToken.role || userData.rol || 'user';
      console.log(`Usuario normal ${email} activo. Rol asignado: ${role}`);
      // *** FIN: Lógica para usuarios normales ***
    }

    // --- Lógica Común: Establecer Cookies y Responder ---
    const sessionCookieOptions = {
      name: '__session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      sameSite: 'Strict',
    };

    const roleCookieOptions = {
      name: 'role',
      value: role,
      httpOnly: false, // El middleware necesita leerla
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      sameSite: 'Strict',
    };

    const response = NextResponse.json({ ok: true, role: role }, { status: 200 });
    response.cookies.set(sessionCookieOptions);
    response.cookies.set(roleCookieOptions);

    console.log(`Login exitoso y cookies establecidas para: ${email}, Rol: ${role}`);
    return response;

  } catch (error) {
    // ... (mismo manejo de errores que antes) ...
    console.error('Error en /api/login:', error);
    let errorMessage = 'Error interno del servidor.';
    let status = 500;

    if (error.code === 'auth/id-token-expired') {
        errorMessage = 'La sesión ha expirado, por favor inicia sesión de nuevo.';
        status = 401;
    } else if (error.code === 'auth/argument-error' || error.code?.startsWith('auth/invalid')) {
        errorMessage = 'Token de autenticación inválido o malformado.';
        status = 401;
    } else if (error.message.includes('Tu cuenta está inactiva')) {
        errorMessage = error.message;
        status = 403;
    } else if (error.status === 404) { // Propagar el 404 si viene de la lógica anterior
        errorMessage = error.message;
        status = 404;
    }


    return NextResponse.json({ error: errorMessage }, { status: status });
  }
}
