import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let cachedDb: ReturnType<typeof getFirestore> | null = null;
let cachedAuth: ReturnType<typeof getAuth> | null = null;

function ensureInit() {
  const projectId = process.env['FIREBASE_PROJECT_ID'];
  const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'];
  const privateKey = process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n');
  const hasExplicitCreds = Boolean(projectId && clientEmail && privateKey);
  const hasDefaultCreds = Boolean(process.env['GOOGLE_APPLICATION_CREDENTIALS']);

  // Also support FIREBASE_SERVICE_ACCOUNT_JSON (used by ciperquest)
  let serviceAccount: any = null;
  const rawSA = process.env['FIREBASE_SERVICE_ACCOUNT_JSON'];
  if (rawSA) {
    try {
      serviceAccount = JSON.parse(rawSA);
      if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    } catch (e) { console.warn('Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', e); }
  }

  if (!hasExplicitCreds && !hasDefaultCreds && !serviceAccount) {
    console.warn('Firebase is not configured. Auth and progress APIs will be unavailable.');
    return false;
  }

  if (!getApps().length) {
    if (serviceAccount) {
      initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
    } else if (hasExplicitCreds) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey: privateKey || '' }),
        projectId
      });
    } else {
      initializeApp();
    }
  }
  return true;
}

export function getDb() {
  if (cachedDb) return cachedDb;
  if (!ensureInit()) return null;
  cachedDb = getFirestore();
  return cachedDb;
}

export function getAdminAuth() {
  if (cachedAuth) return cachedAuth;
  if (!ensureInit()) return null;
  cachedAuth = getAuth();
  return cachedAuth;
}
