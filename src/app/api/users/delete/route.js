// src/app/api/users/delete/route.js
import { NextResponse } from 'next/server';
import { db, auth, storage } from '@/lib/firebase-admin';

/**
 * Extrae la ruta del archivo desde una URL de Firebase Storage de forma segura.
 * @param {string} url La URL HTTPS completa del archivo.
 * @returns {string|null} La ruta del archivo decodificada o null si la URL es inválida.
 */
function getPathFromUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  try {
    // La ruta del archivo está entre '/o/' y antes del '?'
    const pathRegex = /\/o\/(.*?)\?alt=media/;
    const match = url.match(pathRegex);
    if (match && match[1]) {
      // Es importante decodificar la ruta después de extraerla.
      return decodeURIComponent(match[1]);
    }
    console.warn(`Formato de URL no reconocido, no se pudo extraer la ruta: ${url}`);
    return null;
  } catch (e) {
    console.error(`Error al decodificar o analizar la URL: ${url}`, e);
    return null;
  }
}

/**
 * Elimina una imagen de Firebase Storage de forma segura
 * @param {Object} bucket - Bucket de Firebase Storage
 * @param {string} url - URL de la imagen
 * @param {string} description - Descripción para logs
 */
async function deleteImageSafely(bucket, url, description = 'imagen') {
  if (!url) return;
  
  const filePath = getPathFromUrl(url);
  if (filePath) {
    console.log(`  - Eliminando ${description}: ${filePath}`);
    const file = bucket.file(filePath);
    try {
      await file.delete();
      console.log(`  ✅ ${description} eliminada exitosamente`);
    } catch (imgError) {
      if (imgError.code === 404) {
        console.warn(`  ⚠️ ${description} no encontrada (ya eliminada): ${filePath}`);
      } else {
        console.warn(`  ❌ Error al eliminar ${description} ${filePath}: ${imgError.message}`);
      }
    }
  }
}

export async function POST(request) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'Falta el ID del usuario.' }, { status: 400 });
  }

  console.log(`[INICIO] Proceso de eliminación completa para usuario: ${userId}`);

  try {
    const bucket = storage.bucket();
    let totalElementsDeleted = {
      products: 0,
      productImages: 0,
      verificationImages: 0,
      collections: 0
    };

    // --- PASO 1: Eliminar productos y sus imágenes asociadas ---
    console.log(`[PASO 1] Eliminando productos del usuario...`);
    const productsRef = db.collection('products');
    const productsSnapshot = await productsRef.where('userId', '==', userId).get();
    
    if (!productsSnapshot.empty) {
      console.log(`[PASO 1] Se encontraron ${productsSnapshot.size} productos.`);
      const deletePromises = [];

      productsSnapshot.forEach(doc => {
        const productData = doc.data();
        
        // Eliminar imágenes de productos
        if (productData.imageUrls && Array.isArray(productData.imageUrls)) {
          productData.imageUrls.forEach(url => {
            deletePromises.push(deleteImageSafely(bucket, url, 'imagen de producto'));
            totalElementsDeleted.productImages++;
          });
        }
        
        // Eliminar documento del producto
        deletePromises.push(doc.ref.delete());
        totalElementsDeleted.products++;
      });

      await Promise.all(deletePromises);
      console.log(`[PASO 1 COMPLETADO] Productos e imágenes eliminados.`);
    } else {
      console.log(`[PASO 1] El usuario no tiene productos.`);
    }

    // --- PASO 2: Eliminar imágenes de verificación del usuario ---
    console.log(`[PASO 2] Eliminando imágenes de verificación del usuario...`);
    const userDocRef = db.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();
    
    if (userDocSnap.exists) {
      const userData = userDocSnap.data();
      const verificationPromises = [];
      
      // Lista de campos de imagen que pueden existir
      const imageFields = [
        'photoURL',      // Foto de perfil
        'selfieURL',     // Selfie de verificación
        'idCardURL',     // Documento de identidad
        'licenseURL',    // Licencia
        'profileImageURL', // Otras posibles variaciones
        'documentImageURL'
      ];
      
      imageFields.forEach(field => {
        if (userData[field]) {
          verificationPromises.push(deleteImageSafely(bucket, userData[field], `imagen de verificación (${field})`));
          totalElementsDeleted.verificationImages++;
        }
      });

      // También eliminar toda la carpeta de verificación del usuario
      console.log(`  - Eliminando carpeta completa: verification_docs/${userId}/`);
      try {
        const [files] = await bucket.getFiles({
          prefix: `verification_docs/${userId}/`
        });
        
        const folderDeletePromises = files.map(file => {
          console.log(`  - Eliminando archivo de carpeta: ${file.name}`);
          return file.delete().catch(err => {
            console.warn(`  ❌ Error al eliminar ${file.name}: ${err.message}`);
          });
        });
        
        verificationPromises.push(...folderDeletePromises);
        totalElementsDeleted.verificationImages += files.length;
      } catch (folderError) {
        console.warn(`  ⚠️ Error al acceder a la carpeta de verificación: ${folderError.message}`);
      }

      await Promise.all(verificationPromises);
      console.log(`[PASO 2 COMPLETADO] Imágenes de verificación eliminadas.`);
    } else {
      console.log(`[PASO 2] No se encontró el documento del usuario en Firestore.`);
    }

    // --- PASO 3: Eliminar otras colecciones relacionadas (opcional) ---
    console.log(`[PASO 3] Eliminando otras colecciones relacionadas...`);
    
    // Lista de posibles colecciones que podrían estar relacionadas con el usuario
    const collectionsToCheck = [
      'chats',
      'notifications', 
      'favorites',
      'reviews',
      'transactions',
      'messages'
    ];

    const collectionPromises = collectionsToCheck.map(async (collectionName) => {
      try {
        const collectionRef = db.collection(collectionName);
        const snapshot = await collectionRef.where('userId', '==', userId).get();
        
        if (!snapshot.empty) {
          console.log(`  - Eliminando ${snapshot.size} documentos de ${collectionName}`);
          const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
          await Promise.all(deletePromises);
          totalElementsDeleted.collections += snapshot.size;
        }
      } catch (error) {
        console.warn(`  ⚠️ Error al eliminar colección ${collectionName}: ${error.message}`);
      }
    });

    await Promise.all(collectionPromises);
    console.log(`[PASO 3 COMPLETADO] Otras colecciones procesadas.`);

    // --- PASO 4: Eliminar el usuario de Firebase Authentication ---
    try {
      console.log(`[PASO 4] Eliminando usuario de Authentication: ${userId}`);
      await auth.deleteUser(userId);
      console.log(`[PASO 4 COMPLETADO] Usuario eliminado de Authentication.`);
    } catch (authError) {
      console.error(`[ERROR CRÍTICO EN PASO 4] Fallo al eliminar el usuario de Authentication: ${authError.message}`);
      return NextResponse.json({
        error: 'Fallo crítico al eliminar el registro de autenticación del usuario.',
        details: authError.message,
        code: authError.code
      }, { status: 500 });
    }

    // --- PASO 5: Eliminar el documento del usuario de Firestore ---
    console.log(`[PASO 5] Eliminando documento del usuario en Firestore: ${userId}`);
    await userDocRef.delete();
    console.log(`[PASO 5 COMPLETADO] Documento de usuario eliminado de Firestore.`);

    // --- RESUMEN FINAL ---
    console.log(`[ÉXITO] Proceso de eliminación COMPLETA para el usuario: ${userId}`);
    console.log(`📊 Resumen de eliminación:`, totalElementsDeleted);

    return NextResponse.json({
      message: 'Usuario y TODOS sus datos asociados han sido eliminados correctamente.',
      summary: {
        productosEliminados: totalElementsDeleted.products,
        imagenesProductosEliminadas: totalElementsDeleted.productImages,
        imagenesVerificacionEliminadas: totalElementsDeleted.verificationImages,
        otrosDocumentosEliminados: totalElementsDeleted.collections,
        totalElementosEliminados: Object.values(totalElementsDeleted).reduce((a, b) => a + b, 0)
      }
    }, { status: 200 });

  } catch (error) {
    console.error(`[ERROR INESPERADO] Ocurrió un error general en el proceso de eliminación para el usuario ${userId}:`, error);
    return NextResponse.json({
      error: 'Ocurrió un error inesperado en el servidor.',
      details: error.message
    }, { status: 500 });
  }
}