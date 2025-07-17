// src/app/api/create-user/route.js
import { NextResponse } from 'next/server'
import { auth, db } from '@/lib/firebaseAdmin'

export async function POST(request) {
  try {
    const {
      fullName,
      fechaNacimiento,
      sexo,
      telefono,
      universidad,
      profesion,
      email,
      password,
      rol
    } = await request.json()

    // Crea el usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName
    })

    // Graba los datos en Firestore
    await db
      .collection('users')
      .doc(userRecord.uid)
      .set({
        fullName,
        fechaNacimiento,
        sexo,
        telefono,
        universidad,
        profesion,
        email,
        rol,
        active: false,
        isPremium: false,
        fechaSuscripcion: '-',
        fechaVencimiento: '-',
        createdAt: new Date().toISOString(),
        mesesSuscrito: 0
      })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('create-user error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
