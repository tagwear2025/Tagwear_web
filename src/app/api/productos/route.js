import { NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase-admin'; // Usamos la configuración de Admin
import { FieldValue } from 'firebase-admin/firestore';

// Límite de productos por usuario
const PRODUCT_LIMIT = 15;

export async function POST(request) {
  try {
    const formData = await request.formData();

    // Extraer campos del formulario y preparar para validación/almacenamiento
    const nombre = formData.get('nombre');
    const descripcion = formData.get('descripcion');
    const precioStr = formData.get('precio');
    const precio = precioStr ? parseFloat(precioStr) : null; // Parsear a número o null

    // *** CORRECCIÓN CLAVE 1: Coincidir el nombre del campo con el frontend ***
    const categoriaPrincipal = formData.get('categoriaPrincipal');
    const subcategoria = formData.get('subcategoria');
    const marca = formData.get('marca');
    const condicion = formData.get('condicion');

    // *** CORRECCIÓN CLAVE 2: Manejar 'tallas' de forma segura ***
    let tallas = [];
    const tallasString = formData.get('tallas');
    if (tallasString) { // Solo intentar parsear si el campo existe en formData
      try {
        tallas = JSON.parse(tallasString);
      } catch (e) {
        console.error("Error al parsear JSON de tallas:", e);
        return NextResponse.json({ error: 'Formato de tallas inválido.' }, { status: 400 });
      }
    }

    const userId = formData.get('userId');
    const vendedorNombre = formData.get('vendedorNombre');
    const images = formData.getAll('images');

    // Campos opcionales que también se pueden extraer
    const precioOfertaStr = formData.get('precioOferta');
    const precioOferta = precioOfertaStr ? parseFloat(precioOfertaStr) : null;
    const estilo = formData.get('estilo');
    const material = formData.get('material');
    const otrosDetalles = formData.get('otrosDetalles');
    const genero = formData.get('genero'); // Para productos no electrónicos
    const stockStr = formData.get('stock');
    const stock = stockStr ? parseInt(stockStr, 10) : null; // Parsear a número o null

    // Determinar si es un producto electrónico basado en la categoría principal
    const isElectronicProduct = categoriaPrincipal === 'Electrónicos 🔌';

    // --- Validaciones del Servidor MEJORADAS y con logs detallados ---
    let validationErrors = [];

    // Validaciones para campos comunes y obligatorios
    if (!nombre || nombre.trim() === '') validationErrors.push('nombre');
    if (!descripcion || descripcion.trim() === '') validationErrors.push('descripcion');
    if (precio === null || isNaN(precio) || precio <= 0) validationErrors.push('precio');
    if (!categoriaPrincipal || categoriaPrincipal.trim() === '') validationErrors.push('categoriaPrincipal');
    if (!subcategoria || subcategoria.trim() === '') validationErrors.push('subcategoria');
    if (!marca || marca.trim() === '') validationErrors.push('marca');
    if (!condicion || condicion.trim() === '') validationErrors.push('condicion');
    if (!userId || userId.trim() === '') validationErrors.push('userId');
    if (!vendedorNombre || vendedorNombre.trim() === '') validationErrors.push('vendedorNombre');
    if (images.length === 0 || images.length > 4) validationErrors.push('images'); // Frontend permite 1-4
    if (stock === null || isNaN(stock) || stock < 1) validationErrors.push('stock');

    // Validaciones específicas para productos no electrónicos (ropa)
    if (!isElectronicProduct) {
        if (!genero || genero.trim() === '') validationErrors.push('genero');
        if (tallas.length === 0) validationErrors.push('tallas');
        // Si estilo es "Otro" y el campo de texto está vacío
        if (estilo === 'Otro' && (!otrosDetalles || otrosDetalles.trim() === '')) {
             validationErrors.push('otroEstilo'); // Podrías tener un campo específico para esto
        }
        // Si material es "Otro" y el campo de texto está vacío
        if (material === 'Otro' && (!otrosDetalles || otrosDetalles.trim() === '')) {
            validationErrors.push('otroMaterial'); // Podrías tener un campo específico para esto
        }
    }

    if (validationErrors.length > 0) {
        console.error('Faltan datos obligatorios o son inválidos en el backend:', validationErrors);
        return NextResponse.json({ error: `Faltan datos en el formulario: ${validationErrors.join(', ')}.` }, { status: 400 });
    }

    // Validación de precio de oferta
    if (precioOferta !== null && !isNaN(precioOferta) && precioOferta >= precio) {
        return NextResponse.json({ error: 'El precio de oferta debe ser menor que el original.' }, { status: 400 });
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

    // --- Subida de Imágenes a Firebase Storage ---
    const imageUrls = [];
    const bucket = storage.bucket();

    for (const image of images) {
        const buffer = Buffer.from(await image.arrayBuffer());
        // Generar un nombre de archivo único para evitar colisiones
        const fileName = `products/${userId}/${Date.now()}-${image.name.replace(/\s/g, '_').toLowerCase()}`; // Reemplazar espacios y poner en minúsculas
        const file = bucket.file(fileName);

        await file.save(buffer, {
            metadata: {
                contentType: image.type,
            },
        });

        // Hacer el archivo público para obtener una URL de acceso
        await file.makePublic();
        imageUrls.push(file.publicUrl());
    }

    // --- Crear Documento del Producto en Firestore ---
    const productData = {
        userId,
        vendedorNombre: vendedorNombre.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: parseFloat(precio.toFixed(2)), // Asegura dos decimales
        categoriaPrincipal: categoriaPrincipal.trim(),
        subcategoria: subcategoria.trim(),
        marca: marca.trim(),
        condicion: condicion.trim(),
        stock: stock,
        imageUrls,
        isPremium: false,
        premiumHasta: null,
        fechaCreacion: FieldValue.serverTimestamp(),
        estado: 'disponible'
    };

    // Añadir campos opcionales al objeto si tienen valor
    if (precioOferta !== null && !isNaN(precioOferta)) {
        productData.precioOferta = parseFloat(precioOferta.toFixed(2));
    }
    if (tallas.length > 0) { // Solo añadir si hay tallas
        productData.tallas = tallas;
    }
    if (estilo && estilo.trim() !== '') {
        productData.estilo = estilo.trim();
    }
    if (material && material.trim() !== '') {
        productData.material = material.trim();
    }
    if (otrosDetalles && otrosDetalles.trim() !== '') {
        productData.otrosDetalles = otrosDetalles.trim();
    }
    if (!isElectronicProduct && genero && genero.trim() !== '') { // Genero solo si no es electrónico
        productData.genero = genero.trim();
    }


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
    return NextResponse.json({ error: `Error interno del servidor: ${error.message}` }, { status: 500 });
  }
}
