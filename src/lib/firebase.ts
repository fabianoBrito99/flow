import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { ServiceAccount } from "firebase-admin";

const firebaseAdminConfig = process.env.FIREBASE_ADMIN_KEY;

if (!firebaseAdminConfig) {
  throw new Error("FIREBASE_ADMIN_KEY não definida no ambiente");
}

const raw = JSON.parse(firebaseAdminConfig);
const serviceAccount = {
  ...raw,
  private_key: raw.private_key.replace(/\\n/g, '\n'), // ✅ convertendo para quebra real
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
  });
}

export const db = getFirestore();
