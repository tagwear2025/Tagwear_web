import { NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin'; // Asegúrate que tu firebaseAdmin está configurado

export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, nombres, apellidos, fechaNacimiento, sexo, lugarResidencia, password } = body;

        if (!userId) {
            return NextResponse.json({ error: 'El ID del usuario es requerido.' }, { status: 400 });
        }

        // --- 1. Actualizar datos en Firestore ---
        const firestore = admin.firestore();
        const userDocRef = firestore.collection('users').doc(userId);
        
        const dataToUpdate = {
            nombres,
            apellidos,
            fullName: `${nombres} ${apellidos}`, // Aseguramos que el nombre completo se actualice
            fechaNacimiento,
            sexo,
            lugarResidencia,
        };

        // --- 2. Actualizar datos en Firebase Auth (incluyendo contraseña si se proporciona) ---
        const authDataToUpdate = {
            displayName: `${nombres} ${apellidos}`,
        };

        // Si se proporcionó una nueva contraseña, la añadimos al objeto de actualización
        if (password) {
            if (password.length < 6) {
                 return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
            }
            authDataToUpdate.password = password;
        }

        // Ejecutar ambas actualizaciones
        await Promise.all([
            firestore.runTransaction(async (transaction) => {
                transaction.update(userDocRef, dataToUpdate);
            }),
            admin.auth().updateUser(userId, authDataToUpdate)
        ]);

        return NextResponse.json({ message: 'Usuario actualizado exitosamente.' }, { status: 200 });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        // Devolver un mensaje de error más específico si es posible
        const errorMessage = error.code === 'auth/user-not-found' 
            ? 'El usuario no existe en Firebase Authentication.' 
            : 'Ocurrió un error en el servidor.';
        
        return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
    }
}
