export { createBrexAuthenticationProvider } from './providers/brex'
export { drizzleAdapter } from './providers/drizzle'
export {
	createGithubAuthenticationProvider,
	createGithubAuthorizationProvider
} from './providers/github'

export {
	createGoogleAuthenticationProvider,
	createGoogleAuthorizationProvider
} from './providers/google'
export { prismaAdapter } from './providers/prisma'

export { createResendMagicLinkAuthenticationProvider } from './providers/resend'

export { createVercelAuthenticationProvider } from './providers/vercel'
export * from './types'
export {
	createAuth,
	createMagicLinkAuthenticationProvider,
	createOauth2AuthenticationProvider,
	createOauth2AuthorizationProvider
} from './utils'
