import * as admin from "firebase-admin";

if (!admin.apps.length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
  // Remove any surrounding quotes and escaped quotes
  privateKey = privateKey.replace(/^["']|["']$/g, "").replace(/\\"/g, '"');
  // Replace literal '\n' string with actual newlines
  privateKey = privateKey.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

export const adminAuth = admin.auth();
