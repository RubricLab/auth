// Export all types
export * from './types'

// Export utils
export { createAuth } from './utils'

export {
	createOauth2AuthenticationProvider,
	createOauth2AuthorizationProvider,
	createMagicLinkAuthenticationProvider
} from './utils'

// Export client components
export { ClientAuthProvider } from './client'

// Export provider factories
export {
	createGoogleAuthenticationProvider,
	createGoogleAuthorizationProvider
} from './providers/google'

export {
	createGithubAuthenticationProvider,
	createGithubAuthorizationProvider
} from './providers/github'

export { createResendMagicLinkAuthenticationProvider } from './providers/resend'

export { createVercelAuthenticationProvider } from './providers/vercel'

export { createBrexAuthenticationProvider } from './providers/brex'

export { prismaAdapter } from './providers/prisma'
