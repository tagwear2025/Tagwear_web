// src/lib/db.js
import { db } from "./firebaseAdmin";

export async function getUsers() {
  const snapshot = await db.collection("users").get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
