# @rubriclab/auth

An agent-native, type-safe authorization and authentication library for Next.js applications.

By separating notions of auth**entic**ation ("who am I?") and auth**oriz**ation ("what can I do?"), we can scale apps to dozens of integrations while maintaining a simple, type-safe API.

## Features

- 🔐 **Multiple Authentication Methods**: OAuth2, Magic Links, and API Key authorization
- 🏗️ **Flexible Architecture**: Mix and match different providers and database adapters
- 🔒 **Type Safety**: Full TypeScript support with strict typing
- ⚡ **Fast**: Built with Bun.js for optimal performance
- 🎯 **Next.js Optimized**: Built specifically for Next.js with App Router support
- 🔄 **Token Refresh**: Automatic OAuth2 token refresh handling
- 🗄️ **Database Agnostic**: Support for Prisma and Drizzle ORMs

## Installation

```bash
bun add @rubriclab/auth
```

## Quick Start

### 1. Set up your database adapter

Choose between Prisma or Drizzle:

```typescript
// Using Prisma
import { prismaAdapter } from '@rubriclab/auth/providers/prisma'
import { PrismaClient } from '@prisma/client'
import { env } from '@/env'

const prisma = new PrismaClient()
const databaseProvider = prismaAdapter(prisma)

// OR using Drizzle
import { drizzleAdapter } from '@rubriclab/auth/providers/drizzle'
import { drizzle } from 'drizzle-orm/neon-serverless'

const db = drizzle(env.DATABASE_URL)
const databaseProvider = drizzleAdapter(db)
```

### 2. Configure your auth instance

```typescript
import { createAuth } from '@rubriclab/auth'
import { createGithubAuthenticationProvider } from '@rubriclab/auth/providers/github'
import { createGoogleAuthenticationProvider } from '@rubriclab/auth/providers/google'
import { createResendMagicLinkAuthenticationProvider } from '@rubriclab/auth/providers/resend'

export const { routes, actions } = createAuth({
  databaseProvider,
  authUrl: env.NEXT_PUBLIC_AUTH_URL, // e.g., 'https://yourdomain.com'
  
  // OAuth2 Authentication Providers
  oAuth2AuthenticationProviders: {
    github: createGithubAuthenticationProvider({
      githubClientId: env.GITHUB_CLIENT_ID,
      githubClientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    google: createGoogleAuthenticationProvider({
      googleClientId: env.GOOGLE_CLIENT_ID,
      googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  },
  
  // Magic Link Authentication Providers
  magicLinkAuthenticationProviders: {
    resend: createResendMagicLinkAuthenticationProvider({
      resendApiKey: env.RESEND_API_KEY,
      fromEmail: 'noreply@yourdomain.com',
      subject: 'Sign in to Your App',
      html: (url) => `
        <h1>Welcome to Your App</h1>
        <p>Click the link below to sign in:</p>
        <a href="${url}">Sign In</a>
      `,
    }),
  },
})
```

### 3. Set up your API routes

Create an API route handler for authentication:

```typescript
// app/api/auth/[...auth]/route.ts
import { routes } from '@/lib/auth'

export const { GET } = routes
```

### 4. Use in your components

```typescript
// Server Component
import { actions } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await actions.getSession({
    redirectUnauthorized: '/login'
  })
  
  return (
    <div>
      <h1>Welcome, {session.user.email}!</h1>
      {/* Your dashboard content */}
    </div>
  )
}

// Client Component
'use client'
import { CreateAuthContext } from '@rubriclab/auth/client'

const { ClientAuthProvider, useSession } = CreateAuthContext<typeof session>()

export function DashboardClient({ session }: { session: typeof session }) {
  return (
    <ClientAuthProvider session={session}>
      <DashboardContent />
    </ClientAuthProvider>
  )
}

function DashboardContent() {
  const session = useSession()
  
  return (
    <div>
      <h2>Connected Accounts:</h2>
      <ul>
        {session.user.oAuth2AuthenticationAccounts.map(account => (
          <li key={account.accountId}>{account.provider}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 5. Add authentication actions

```typescript
import { actions } from '@/lib/auth'

const { signIn, sendMagicLink, signOut } = actions

// Sign in with OAuth2
await signIn({
  provider: 'github',
  callbackUrl: '/dashboard'
})

// Send magic link
await sendMagicLink({
  provider: 'resend',
  email: 'user@example.com'
})

// Sign out
await signOut({ redirect: '/' })
```

## Environment Variables

### Required Variables

```env
# Your application's base URL for auth callbacks
NEXT_PUBLIC_AUTH_URL=https://yourdomain.com
```

### OAuth2 Providers

#### GitHub
```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

#### Google
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Magic Link Providers

#### Resend
```env
RESEND_API_KEY=your_resend_api_key
```

## Supported Providers

### Authentication Providers

#### OAuth2 Authentication
- **GitHub** (`@rubriclab/auth/providers/github`)
  - Scopes: `read:user`, `user:email` (default)
  - Features: User authentication, email retrieval
  - Note: GitHub tokens don't expire by default

- **Google** (`@rubriclab/auth/providers/google`)
  - Scopes: `userinfo.email`, `userinfo.profile` (default)
  - Features: User authentication, token refresh support
  - Additional scopes available for Gmail, Drive, Calendar, etc.

#### Magic Link Authentication
- **Resend** (`@rubriclab/auth/providers/resend`)
  - Features: Email-based magic link authentication
  - Customizable email templates
  - 24-hour expiration

### Authorization Providers

#### OAuth2 Authorization
- **GitHub** (`@rubriclab/auth/providers/github`)
  - Customizable scopes for repository access, organization management, etc.
  - Available scopes: `repo`, `admin:org`, `workflow`, `packages`, etc.

- **Google** (`@rubriclab/auth/providers/google`)
  - Customizable scopes for Gmail, Drive, Calendar, etc.
  - Available scopes: `gmail.readonly`, `drive.file`, `calendar.events`, etc.

#### API Key Authorization
- **Brex** (`@rubriclab/auth/providers/brex`)
  - Features: API key-based authorization for Brex platform
  - Account ID retrieval from Brex API

- **Vercel** (`@rubriclab/auth/providers/vercel`)
  - Features: API key-based authorization for Vercel platform
  - Account ID retrieval from Vercel API

### Database Adapters

- **Prisma** (`@rubriclab/auth/providers/prisma`)
  - Full Prisma ORM support
  - Type-safe database operations
  - Automatic schema generation

- **Drizzle** (`@rubriclab/auth/providers/drizzle`)
  - Drizzle ORM support with PostgreSQL
  - Optimized for Neon serverless
  - Lightweight and fast

## Database Schema

The library requires the following database tables:

### Core Tables
- `users` - User accounts
- `sessions` - User sessions
- `oauth2_authentication_requests` - OAuth2 authentication flow state
- `oauth2_authorization_requests` - OAuth2 authorization flow state
- `magic_link_requests` - Magic link authentication state

### Account Tables
- `oauth2_authentication_accounts` - Connected OAuth2 authentication accounts
- `oauth2_authorization_accounts` - Connected OAuth2 authorization accounts
- `api_key_authorization_accounts` - Connected API key authorization accounts

## Advanced Usage

### Custom OAuth2 Provider

```typescript
import { createOauth2AuthenticationProvider } from '@rubriclab/auth'

const customProvider = createOauth2AuthenticationProvider({
  getAuthenticationUrl: async ({ redirectUri, state }) => {
    const url = new URL('https://your-provider.com/oauth/authorize')
    url.searchParams.set('client_id', process.env.CUSTOM_CLIENT_ID!)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('state', state)
    url.searchParams.set('scope', 'read:user')
    return url
  },
  getToken: async ({ code, redirectUri }) => {
    // Implement token exchange
    return {
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: new Date(Date.now() + 3600000)
    }
  },
  getUser: async ({ accessToken }) => {
    // Implement user info retrieval
    return {
      accountId: 'user_id',
      email: 'user@example.com'
    }
  },
  refreshToken: async ({ refreshToken }) => {
    // Implement token refresh
    return {
      accessToken: 'new_token',
      refreshToken: 'new_refresh',
      expiresAt: new Date(Date.now() + 3600000)
    }
  }
})
```

## Type Safety

The library provides full TypeScript support with strict typing:

```typescript
// Session type inference
const session = await auth.actions.getSession({ redirectUnauthorized: '/login' })
// session.user.email is typed as string
// session.user.oAuth2AuthenticationAccounts is typed as array

// Provider type safety
await auth.actions.signIn({
  provider: 'github', // TypeScript will ensure this is a valid provider
  callbackUrl: '/dashboard'
})
```

## License

[MIT](LICENSE)
