import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { buildFirebaseConfig } from './firebaseEnv'

const app = getApps().length ? getApp() : initializeApp(buildFirebaseConfig())

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()


