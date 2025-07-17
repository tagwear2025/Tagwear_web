// src/lib/db.js
import { db } from "./firebase-admin";

export async function getUsers() {
  try {
    const snapshot = await db.collection("users").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
}