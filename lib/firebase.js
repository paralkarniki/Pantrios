import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAwLQa8A3eh_3N2rDdqETfenoRdznY95rY',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'pantrio-gen.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'pantrio-gen',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'pantrio-gen.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1074809960188',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1074809960188:web:39ed1b2ddff497e64c4979',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Auth only in browser environments
export const auth = typeof window !== 'undefined' ? getAuth(app) : null

// Optionally connect to emulator for development (only in browser)
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, 'localhost', 8080)
  } catch (err) {
    // Emulator already connected, ignore
  }
}

export default app
