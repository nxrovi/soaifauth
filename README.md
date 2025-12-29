# VenomAuth 🔐

A beautiful black and white Next.js authentication library built with TypeScript and SQL database support. Works with all languages and categories.

## Features

- ✅ **Next.js 14** with App Router
- ✅ **TypeScript** for type safety
- ✅ **Prisma** with SQLite/PostgreSQL support
- ✅ **JWT-based** authentication
- ✅ **Multi-language** support (English, Bengali, Spanish, French, Hindi, and more)
- ✅ **Beautiful black and white** UI design
- ✅ **Protected routes** with middleware
- ✅ **Session management**
- ✅ **Password hashing** with bcrypt

## Getting Started

### Installation

```bash
npm install
```

### Setup Database

1. Copy the environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your database URL, JWT secret, and Firebase web config:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-firebase-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id" # optional
NEXT_PUBLIC_FIREBASE_CLIENT_ID="your-firebase-web-client-id" # optional, used for token audience checks
FIREBASE_PROJECT_ID="your-project-id"
```

3. Generate Prisma client and push schema:
```bash
npm run db:generate
npm run db:push
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
VenomAuth/
├── app/
│   ├── api/auth/          # Authentication API routes
│   ├── dashboard/         # Protected dashboard page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── layout.tsx         # Root layout
├── components/
│   ├── auth/              # Authentication components
│   └── ui/                # Reusable UI components
├── lib/
│   ├── auth.ts            # Authentication utilities
│   ├── prisma.ts          # Prisma client
│   └── validations.ts     # Zod schemas
├── prisma/
│   └── schema.prisma      # Database schema
└── public/
    └── locales/           # i18n translations
```

## API Routes

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

## Supported Languages

- English (en)
- Bengali (bn)
- Spanish (es)
- French (fr)
- Hindi (hi)
- German (de)
- Arabic (ar)
- Japanese (ja)
- Chinese (zh)

## Usage

### Register a User

```typescript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe'
  })
})
```

### Login

```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})
```

### Use Auth Hook

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, loading, logout } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>
  
  return <div>Welcome {user.email}</div>
}
```

## Database Schema

- **User**: Stores user information
- **Session**: Manages user sessions
- **Token**: Handles email verification and password reset tokens

## License

MIT

