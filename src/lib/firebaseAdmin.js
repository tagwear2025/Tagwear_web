// src/lib/firebaseAdmin.js
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

// Intentamos leer el JSON en disco primero
let serviceAccount;
try {
  const jsonPath = path.join(process.cwd(), 'serviceAccountKey.json');
  const file = readFileSync(jsonPath, 'utf8');
  serviceAccount = JSON.parse(file);
} catch (err) {
  console.warn(
    'No se encontró serviceAccountKey.json, usando variables de entorno'
  );
  // Fallback a las vars de entorno (quita comillas y convierte \n)
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
  serviceAccount = {
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  rawKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '')
  };
}

// Asegurarnos que el bucket de storage esté en la configuración
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // AÑADIDO: Incluir la URL del bucket de storage en la inicialización
    storageBucket: storageBucket 
  });
}

// Exportaciones de los servicios de Firebase
export const auth = admin.auth();
export const db   = admin.firestore();
// AÑADIDO: Exportar el servicio de Storage
export const storage = admin.storage(); 
export { admin }; // Exportar el namespace completo por si se necesita

