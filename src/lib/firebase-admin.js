// src/lib/firebase-admin.js
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

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
    throw new Error('❌ Faltan variables de entorno requeridas para Firebase Admin SDK');
  }

  serviceAccount = {
    type: "service_account",
    project_id: projectId,
    client_email: clientEmail,
    // Limpiar la private key correctamente
    private_key: privateKey.replace(/\\n/g, '\n'),
    // Estas son requeridas por el SDK pero no críticas
    private_key_id: "", 
    client_id: "",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    universe_domain: "googleapis.com"
  };
}

// Configurar storage bucket
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

// Inicializar Firebase Admin solo si no está ya inicializado
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: storageBucket
    });
    console.log('✅ Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error);
    throw error;
  }
}

// Exportar los servicios
export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
export { admin };