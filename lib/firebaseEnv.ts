const firebaseDefaults: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyCACQzxKWQBDH2OWtirg-1QUw8rUzvmfBY',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'venomauth-559aa.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'venomauth-559aa',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '1041549923614',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:1041549923614:web:6025d5b42e90116773a50f',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'venomauth-559aa.appspot.com',
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: 'G-E96TZTD5QQ',
}

export function getFirebaseEnv(name: keyof typeof firebaseDefaults): string {
  const value = process.env[name] ?? firebaseDefaults[name]
  if (!value) {
    throw new Error(`Missing env var ${name} for Firebase configuration`)
  }
  return value
}

export function getOptionalFirebaseEnv(name: string): string | undefined {
  const value = process.env[name]
  return value && value.trim() ? value : undefined
}

function getOptionalFirebaseEnvWithDefault(name: keyof typeof firebaseDefaults): string | undefined {
  return getOptionalFirebaseEnv(name) ?? firebaseDefaults[name]
}

export function getFirebaseEnvWithServer(
  name: keyof typeof firebaseDefaults,
  serverName: string
): string {
  const value =
    process.env[name] ??
    process.env[serverName] ??
    firebaseDefaults[name]

  if (!value) {
    throw new Error(`Missing env var ${serverName ?? name} for Firebase configuration`)
  }

  return value
}

export function buildFirebaseConfig() {
  const baseConfig = {
    apiKey: getFirebaseEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getFirebaseEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: getFirebaseEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    messagingSenderId: getFirebaseEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getFirebaseEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  }

  const storageBucket = getOptionalFirebaseEnvWithDefault('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET')
  const measurementId = getOptionalFirebaseEnvWithDefault('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID')

  return {
    ...baseConfig,
    ...(storageBucket ? { storageBucket } : {}),
    ...(measurementId ? { measurementId } : {}),
  }
}

export const firebaseProjectId = getFirebaseEnvWithServer(
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'FIREBASE_PROJECT_ID'
)
export const firebaseClientId =
  getOptionalFirebaseEnv('NEXT_PUBLIC_FIREBASE_CLIENT_ID') ??
  getOptionalFirebaseEnv('FIREBASE_CLIENT_ID')


