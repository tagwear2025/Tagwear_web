import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// GET: Obtener datos de un usuario específico
export async function GET(request, { params }) {
  try {
    const { userId } = params;
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(doc.data(), { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT: Actualizar datos de un usuario específico
export async function PUT(request, { params }) {
  try {
    const { userId } = params;
    const body = await request.json();
    const userRef = db.collection('users').doc(userId);

    // Filtrar solo los campos permitidos para evitar que se actualicen campos no deseados
    const allowedFields = ['nombres', 'apellidos', 'fechaNacimiento', 'sexo', 'lugarResidencia', 'telefono'];
    const dataToUpdate = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        dataToUpdate[field] = body[field];
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
        return NextResponse.json({ error: 'No se proporcionaron campos para actualizar' }, { status: 400 });
    }

    await userRef.update(dataToUpdate);

    return NextResponse.json({ message: 'Usuario actualizado con éxito' }, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
