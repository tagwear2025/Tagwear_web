// src/lib/firebase-admin.js
import admin from 'firebase-admin';

// Construye el objeto de credenciales únicamente desde las variables de entorno
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Reemplaza los caracteres de escape \\n por saltos de línea reales \n
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

// Asegúrate de que todas las credenciales necesarias están presentes
if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  console.error('Faltan las variables de entorno de Firebase Admin. El despliegue fallará.');
}

// Evita la reinicialización de la app en entornos de desarrollo
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

// Exporta los servicios de Firebase Admin que usas en tu app
export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
export { admin }; // Exporta el namespace completo por si se necesita
