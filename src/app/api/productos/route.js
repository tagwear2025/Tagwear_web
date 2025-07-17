import { NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebaseAdmin'; // Usamos la configuración de Admin
import { FieldValue } from 'firebase-admin/firestore';

// Límite de productos por usuario
const PRODUCT_LIMIT = 15;

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Extraer campos del formulario
    const nombre = formData.get('nombre');
    const descripcion = formData.get('descripcion');
    const precio = parseFloat(formData.get('precio'));
    const categoria = formData.get('categoria');
    const tallas = JSON.parse(formData.get('tallas'));
    const userId = formData.get('userId');
    const vendedorNombre = formData.get('vendedorNombre');
    const images = formData.getAll('images');

    // --- Validaciones del Servidor ---
    if (!nombre || !descripcion || !precio || !categoria || !tallas || !userId || !vendedorNombre) {
      return NextResponse.json({ error: 'Faltan datos en el formulario.' }, { status: 400 });
    }
    if (images.length === 0 || images.length > 5) {
      return NextResponse.json({ error: 'Debe subir entre 1 y 5 imágenes.' }, { status: 400 });
    }

    // --- Verificar Límite de Productos ---
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        return NextResponse.json({ error: 'El usuario no existe.' }, { status: 404 });
    }

    const userData = userDoc.data();
    const productCount = userData.productCount || 0;

    if (productCount >= PRODUCT_LIMIT) {
        return NextResponse.json({ error: `Has alcanzado el límite de ${PRODUCT_LIMIT} productos.` }, { status: 403 });
    }

    // --- Subida de Imágenes a Firebase Storage (MÉTODO CORREGIDO) ---
    const imageUrls = [];
    // ***** LA CORRECCIÓN CLAVE ESTÁ AQUÍ *****
    // Obtenemos el bucket por defecto desde el servicio de storage
    const bucket = storage.bucket(); 

    for (const image of images) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const fileName = `products/${userId}/${Date.now()}-${image.name}`;
      const file = bucket.file(fileName); // Ahora .file() SÍ existe

      // Guardar el archivo en el bucket
      await file.save(buffer, {
        metadata: {
          contentType: image.type,
        },
      });
      
      // Hacer el archivo público para obtener una URL de acceso
      await file.makePublic();

      // Obtener la URL pública
      imageUrls.push(file.publicUrl());
    }

    // --- Crear Documento del Producto en Firestore ---
    const productData = {
      userId,
      vendedorNombre,
      nombre,
      descripcion,
      precio,
      categoria,
      tallas,
      imageUrls,
      isPremium: false,
      premiumHasta: null,
      fechaCreacion: FieldValue.serverTimestamp(),
      estado: 'disponible'
    };

    const productRef = await db.collection('products').add(productData);
    
    // --- Actualizar el contador de productos del usuario ---
    await userRef.update({
        productCount: FieldValue.increment(1)
    });

    return NextResponse.json({ 
        message: 'Producto subido con éxito', 
        productId: productRef.id 
    }, { status: 201 });

  } catch (error) {
    // Loguear el error real en la consola del servidor para depuración
    console.error('Error en API de productos:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
