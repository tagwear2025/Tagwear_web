// src/scripts/setAdmin.js (Corregido para establecer el claim correcto)
const serviceAccount = require('../lib/firebase-adminsdk.json');
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

admin
  .auth()
  .getUserByEmail("admin@admin.com")
  .then((user) => admin.auth().setCustomUserClaims(user.uid, { role: 'admin' }))
  .then(() => console.log("✅ Admin claim asignado correctamente"))
  .catch((error) => console.error("❌ Error:", error));
