// src/app/api/logout/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('API /api/logout: Iniciando proceso de logout...');

    // 1. Crear la respuesta por adelantado.
    const response = NextResponse.json(
      { message: 'Logout exitoso, cookies eliminadas' },
      { status: 200 }
    );

    // 2. Usar el método .cookies.set() en el OBJETO DE RESPUESTA para expirar las cookies.
    // Esto es el equivalente a eliminarlas.
    response.cookies.set({
      name: '__session',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0, // maxAge: 0 le dice al navegador que la elimine inmediatamente.
    });
    console.log('API /api/logout: Cookie __session marcada para eliminación.');

    response.cookies.set({
      name: 'role',
      value: '',
      httpOnly: false, // Importante: debe coincidir con cómo se creó la cookie.
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    console.log('API /api/logout: Cookie role marcada para eliminación.');

    // 3. Devolver la respuesta que ahora contiene las instrucciones para eliminar las cookies.
    return response;

  } catch (error) {
    console.error('Error en /api/logout:', error);
    return NextResponse.json({ error: 'Falló el cierre de sesión' }, { status: 500 });
  }
}
