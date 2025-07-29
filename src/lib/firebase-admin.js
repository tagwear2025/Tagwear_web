// src/lib/firebase-admin.js
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

let app;
let db;
let storage;
let adminAuth;

// Configuración del service account
let serviceAccount;

try {
    // Primero intentamos leer el archivo JSON local
    const jsonPath = path.join(process.cwd(), 'serviceAccountKey.json');
    const file = readFileSync(jsonPath, 'utf8');
    serviceAccount = JSON.parse(file);
    console.log('✅ Service account cargado desde archivo local');
} catch (err) {
    console.log('📄 Archivo serviceAccountKey.json no encontrado, usando variables de entorno');

    // Fallback a variables de entorno (para producción en Vercel)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    // Validar que todas las variables estén presentes
    if (!privateKey || !projectId || !clientEmail) {
        console.error('❌ Variables de entorno faltantes:');
        console.error('FIREBASE_PRIVATE_KEY:', privateKey ? 'Presente' : 'Faltante');
        console.error('FIREBASE_PROJECT_ID:', projectId ? 'Presente' : 'Faltante');
        console.error('FIREBASE_CLIENT_EMAIL:', clientEmail ? 'Presente' : 'Faltante');
        throw new Error('❌ Faltan variables de entorno requeridas para Firebase Admin SDK');
    }

    serviceAccount = {
        type: "service_account",
        project_id: projectId,
        client_email: clientEmail,
        // Limpiar la private key correctamente
        private_key: privateKey.replace(/\\n/g, '\n'),
        // Estas son requeridas por el SDK pero no críticas para la mayoría de los casos
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
        client_id: process.env.FIREBASE_CLIENT_ID || "",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        universe_domain: "googleapis.com"
    };
}

// Configurar storage bucket
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

// Inicializar Firebase Admin solo si no está ya inicializado
try {
    if (!admin.apps.length) {
        app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: storageBucket
        });
        console.log('✅ Firebase Admin inicializado correctamente');
    } else {
        // Si ya está inicializado, obtener la app existente
        app = admin.app();
        console.log('✅ Firebase Admin ya estaba inicializado, usando instancia existente');
    }

    // Inicializar los servicios después de confirmar que app está disponible
    db = admin.firestore(app);
    storage = admin.storage(app);
    adminAuth = admin.auth(app);

    console.log('✅ Servicios de Firebase inicializados:');
    console.log('- Firestore:', db ? 'OK' : 'ERROR');
    console.log('- Storage:', storage ? 'OK' : 'ERROR');
    console.log('- Auth:', adminAuth ? 'OK' : 'ERROR');

} catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error);
    console.error('Detalles del error:', error.message);
    
    // En caso de error, asegurar que las variables no queden undefined
    db = null;
    storage = null;
    adminAuth = null;
    
    throw error;
}

// ✅ Verificación adicional antes de exportar
if (!adminAuth) {
    console.error('❌ CRÍTICO: adminAuth no se inicializó correctamente');
}

export { db, storage, adminAuth, admin };