import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function getAdminFirestore() {
    if (getApps().length === 0) {
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_APP_HOSTING || process.env.NODE_ENV === 'production') {
            initializeApp({ projectId: "c4h-wesbite" });
        } else {
            console.warn('Local dev: No ADC found, Firestore dynamic content will be mocked/bypassed.');
            return null;
        }
    }
    return getApps().length > 0 ? getFirestore() : null;
}
