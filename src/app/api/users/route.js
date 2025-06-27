// CORRECCIÓN: Se cambió el nombre del import a 'firebaseAdmin'
import { db } from '@/lib/firebaseAdmin'; 

function formatDate(field) {
  // Esta función puede dar error si 'field' es null o undefined. La hacemos más segura.
  if (field && typeof field.toDate === 'function') {
    return field.toDate().toISOString().split('T')[0];
  }
  if (typeof field === 'string') {
    // Si ya es un string con formato YYYY-MM-DD, lo devolvemos tal cual.
    if (field.match(/^\d{4}-\d{2}-\d{2}/)) {
        return field;
    }
  }
  // Para cualquier otro caso (null, undefined, etc.), devolvemos null para ser consistentes.
  return null;
}

export async function GET() {
  const snapshot = await db.collection('users').get();

  const users = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // Tu modelo de datos usa 'active', lo cual es perfecto.
    // La API GET no necesita modificarlo.
    fechaSuscripcion: formatDate(doc.data().fechaSuscripcion),
    fechaVencimiento: formatDate(doc.data().fechaVencimiento),
  }));

  return Response.json(users);
}