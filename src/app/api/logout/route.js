// src/app/api/logout/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Importar cookies de next/headers

export async function POST(request) {
  try {
    console.log('API /api/logout: Iniciando proceso de logout...');

    // Obtener instancia de cookies para manipularlas
    const cookieStore = cookies();

    // Eliminar la cookie __session estableciendo Max-Age a 0
    cookieStore.set({
      name: '__session',
      value: '', // Valor vacío
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0, // Expirar inmediatamente
      sameSite: 'Strict',
    });
    console.log('API /api/logout: Cookie __session marcada para eliminación.');

    // Eliminar la cookie role estableciendo Max-Age a 0
    cookieStore.set({
      name: 'role',
      value: '', // Valor vacío
      httpOnly: false, // Coincidir con cómo se estableció
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0, // Expirar inmediatamente
      sameSite: 'Strict',
    });
    console.log('API /api/logout: Cookie role marcada para eliminación.');

    // Devolver una respuesta exitosa
    return NextResponse.json({ message: 'Logout successful, cookies cleared' }, { status: 200 });

  } catch (error) {
    console.error('Error en /api/logout:', error);
    // Devolver un error genérico
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}

// Opcional: Puedes definir un método GET si prefieres llamarlo así desde el cliente,
// pero POST es generalmente preferido para acciones que cambian el estado (como logout).
// export async function GET(request) {
//   return await POST(request); // Simplemente reutiliza la lógica POST
// }
