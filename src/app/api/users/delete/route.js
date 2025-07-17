// src/app/api/users/delete/route.js
import { NextResponse } from 'next/server';
import { db, auth, storage } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'Falta el ID del usuario.' }, { status: 400 });
  }

  try {
    // Paso 1: Obtener todos los productos del usuario antes de eliminar
    const productosRef = db.collection('products'); // Corregido: usar 'products' en lugar de 'productos'
    const productosSnapshot = await productosRef.where('userId', '==', userId).get();
    
    // Paso 2: Eliminar las imágenes de Firebase Storage de todos los productos
    const bucket = storage.bucket();
    const deleteImagePromises = [];
    
    productosSnapshot.forEach(doc => {
      const productData = doc.data();
      if (productData.imageUrls && productData.imageUrls.length > 0) {
        productData.imageUrls.forEach(url => {
          deleteImagePromises.push(
            (async () => {
              try {
                // Extrae la ruta del archivo desde la URL pública
                const filePath = new URL(url).pathname.split('/').slice(3).join('/');
                await bucket.file(decodeURIComponent(filePath)).delete();
              } catch (imgError) {
                // Si una imagen falla, solo advertimos en consola pero continuamos
                console.warn(`No se pudo eliminar la imagen ${url}:`, imgError.message);
              }
            })()
          );
        });
      }
    });

    // Esperar a que se eliminen todas las imágenes
    await Promise.all(deleteImagePromises);

    // Paso 3: Eliminar todos los documentos de productos del usuario
    const deleteProductPromises = productosSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deleteProductPromises);

    // Paso 4: Eliminar el usuario de Firebase Authentication
    await auth.deleteUser(userId);

    // Paso 5: Eliminar el documento del usuario de Firestore
    await db.collection('users').doc(userId).delete();

    return NextResponse.json({ 
      message: 'Usuario, sus productos e imágenes eliminados completamente.',
      productosEliminados: productosSnapshot.size 
    }, { status: 200 });
    
  } catch (error) {
    console.error(`Error al eliminar usuario ${userId} y sus productos:`, error);
    return NextResponse.json({ 
      error: 'No se pudo eliminar el usuario y sus productos.',
      details: error.message 
    }, { status: 500 });
  }
}