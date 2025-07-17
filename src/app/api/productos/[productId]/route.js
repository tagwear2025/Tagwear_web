import { NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

// GET: Obtener datos de un producto específico (útil para la página de edición)
export async function GET(request, { params }) {
    try {
        const { productId } = params;
        const productRef = db.collection('products').doc(productId);
        const doc = await productRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        return NextResponse.json({ id: doc.id, ...doc.data() }, { status: 200 });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}


// PUT: Actualizar un producto
export async function PUT(request, { params }) {
    try {
        const { productId } = params;
        const body = await request.json();
        const productRef = db.collection('products').doc(productId);

        // Aquí podrías añadir validación de campos si lo deseas
        await productRef.update(body);

        return NextResponse.json({ message: 'Producto actualizado con éxito' }, { status: 200 });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

// DELETE: Eliminar un producto
export async function DELETE(request, { params }) {
    try {
        const { productId } = params;
        const productRef = db.collection('products').doc(productId);
        const docSnap = await productRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        const productData = docSnap.data();
        const userId = productData.userId;

        // Eliminar imágenes de Firebase Storage
        if (productData.imageUrls && productData.imageUrls.length > 0) {
            const bucket = storage.bucket();
            for (const url of productData.imageUrls) {
                try {
                    // Extrae la ruta del archivo desde la URL pública
                    const filePath = new URL(url).pathname.split('/').slice(3).join('/');
                    await bucket.file(decodeURIComponent(filePath)).delete();
                } catch (imgError) {
                    // Si una imagen falla, solo advertimos en consola pero continuamos
                    console.warn(`No se pudo eliminar la imagen ${url}:`, imgError.message);
                }
            }
        }

        // Eliminar documento de Firestore
        await productRef.delete();

        // Decrementar el contador de productos del usuario
        if (userId) {
            const userRef = db.collection('users').doc(userId);
            await userRef.update({ productCount: FieldValue.increment(-1) });
        }

        return NextResponse.json({ message: 'Producto eliminado con éxito' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
