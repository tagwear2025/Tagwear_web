import { NextResponse } from 'next/server';
// CORRECCIÓN: Se cambió el nombre del import a 'firebaseAdmin'
// También, tu archivo firebaseAdmin exporta 'auth' y 'db', no un 'admin' genérico.
// Usaremos 'db' directamente, que es lo correcto según tu configuración.
import { db } from '@/lib/firebaseAdmin';

export async function POST(req) {
  try {
    const { userId } = await req.json();
    // La referencia correcta es usando el 'db' que importamos.
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const current = userSnap.data().active || false;
    await userRef.update({ active: !current });

    return NextResponse.json({ message: `Usuario ${!current ? 'activado' : 'desactivado'}` });
  } catch (error) {
    console.error("Error en toggle-status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}