// src/app/api/productos/[productId]/route.js

import { NextResponse } from 'next/server';
import { db, storage, adminAuth } from '@/lib/firebase-admin'; // Esto ahora coincidirá con la exportación
// CORRECCIÓN AQUÍ: Usar 'import ... from' en lugar de '= require'
import { FieldValue } from 'firebase-admin/firestore'; 
import { v4 as uuidv4 } from 'uuid'; // Para generar IDs únicos para las imágenes

// Helper para obtener el UID del usuario desde el token de autenticación
async function getUserIdFromRequest(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error("Auth Error: Missing or malformed Authorization header.");
        return null;
    }
    const idToken = authHeader.split(' ')[1];
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        console.log("Token verificado exitosamente para UID:", decodedToken.uid); // Log para éxito
        return decodedToken.uid;
    } catch (error) {
        console.error("Auth Error: Failed to verify ID token:", error.code, error.message);
        return null;
    }
}

// GET: Obtener datos de un producto específico
// Permite que el propietario del producto acceda a sus detalles.
export async function GET(request, { params }) {
    try {
        const { productId } = params;
        const userId = await getUserIdFromRequest(request); // Obtener UID del usuario

        if (!userId) {
            return NextResponse.json({ error: 'No autorizado. Se requiere autenticación.' }, { status: 401 });
        }

        const productRef = db.collection('products').doc(productId);
        const doc = await productRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        const productData = doc.data();

        // Verificar si el usuario autenticado es el propietario del producto
        if (productData.userId !== userId) {
            return NextResponse.json({ error: 'Prohibido. No eres el propietario de este producto.' }, { status: 403 });
        }

        return NextResponse.json({ id: doc.id, ...productData }, { status: 200 });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Error interno del servidor al obtener el producto' }, { status: 500 });
    }
}

// PUT: Actualizar un producto (incluyendo imágenes)
export async function PUT(request, { params }) {
    try {
        const { productId } = params;
        const userId = await getUserIdFromRequest(request); // Obtener UID del usuario

        if (!userId) {
            return NextResponse.json({ error: 'No autorizado. Se requiere autenticación.' }, { status: 401 });
        }

        const productRef = db.collection('products').doc(productId);
        const productSnap = await productRef.get();

        if (!productSnap.exists) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        const existingProductData = productSnap.data();

        // Verificar que el usuario sea el propietario del producto
        if (existingProductData.userId !== userId) {
            return NextResponse.json({ error: 'Prohibido. No eres el propietario de este producto.' }, { status: 403 });
        }

        // Parsear el FormData
        const formData = await request.formData();
        const dataString = formData.get('data');
        const newImagesFiles = formData.getAll('newImages'); // Es un array de File
        const existingImageUrlsString = formData.get('existingImageUrls');
        const imagesToDeleteString = formData.get('imagesToDelete');

        let productData = {};
        if (dataString) {
            productData = JSON.parse(dataString);
        }

        let existingImageUrls = [];
        if (existingImageUrlsString) {
            existingImageUrls = JSON.parse(existingImageUrlsString);
        }

        let imagesToDelete = [];
        if (imagesToDeleteString) {
            imagesToDelete = JSON.parse(imagesToDeleteString);
        }

        const bucket = storage.bucket();
        let updatedImageUrls = [...existingImageUrls]; // Empezar con las URLs existentes que no se eliminan

        // 1. Eliminar imágenes marcadas para borrar
        for (const url of imagesToDelete) {
            try {
                const urlObj = new URL(url);
                const filePath = decodeURIComponent(urlObj.pathname.split('/o/')[1]);
                await bucket.file(filePath).delete();
                console.log(`Imagen eliminada de Storage: ${filePath}`);
            } catch (imgError) {
                console.warn(`Advertencia: No se pudo eliminar la imagen de Storage ${url}:`, imgError.message);
            }
        }

        // 2. Subir nuevas imágenes
        for (const file of newImagesFiles) {
            if (file && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const originalExtension = file.name.split('.').pop();
                const fileName = `products/${userId}/${productId}/${uuidv4()}.${originalExtension}`;
                const fileRef = bucket.file(fileName);

                await fileRef.save(buffer, {
                    contentType: file.type,
                    public: true, // Hacer la imagen pública si es necesario
                    metadata: {
                        firebaseStorageDownloadTokens: uuidv4(), // Token para acceso público y fácil
                    },
                });

                const newPublicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
                updatedImageUrls.push(newPublicUrl);
                console.log(`Nueva imagen subida: ${newPublicUrl}`);
            }
        }

        // Combinar datos del formulario y URLs de imágenes actualizadas
        const updatedFields = {
            ...productData,
            imageUrls: updatedImageUrls,
            updatedAt: FieldValue.serverTimestamp(),
        };

        await productRef.update(updatedFields);

        return NextResponse.json({ message: 'Producto actualizado con éxito', imageUrls: updatedImageUrls }, { status: 200 });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Error interno del servidor al actualizar el producto' }, { status: 500 });
    }
}

// DELETE: Eliminar un producto
export async function DELETE(request, { params }) {
    try {
        const { productId } = params;
        const userId = await getUserIdFromRequest(request);

        if (!userId) {
            return NextResponse.json({ error: 'No autorizado. Se requiere autenticación.' }, { status: 401 });
        }

        const productRef = db.collection('products').doc(productId);
        const docSnap = await productRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        const productData = docSnap.data();

        if (productData.userId !== userId) {
            return NextResponse.json({ error: 'Prohibido. No eres el propietario de este producto.' }, { status: 403 });
        }

        if (productData.imageUrls && productData.imageUrls.length > 0) {
            const bucket = storage.bucket();
            for (const url of productData.imageUrls) {
                try {
                    const urlObj = new URL(url);
                    const filePath = decodeURIComponent(urlObj.pathname.split('/o/')[1]);
                    await bucket.file(filePath).delete();
                    console.log(`Imagen eliminada de Storage: ${filePath}`);
                } catch (imgError) {
                    console.warn(`Advertencia: No se pudo eliminar la imagen de Storage ${url}:`, imgError.message);
                }
            }
        }

        await productRef.delete();
        console.log(`Documento de producto eliminado: ${productId}`);

        if (userId) {
            const userRef = db.collection('users').doc(userId);
            await userRef.update({ productCount: FieldValue.increment(-1) }).catch(error => {
                console.warn(`Advertencia: No se pudo decrementar el contador de productos para el usuario ${userId}:`, error.message);
            });
        }

        return NextResponse.json({ message: 'Producto eliminado con éxito' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Error interno del servidor al eliminar el producto' }, { status: 500 });
    }
}
