export * from './types'

export { createAuth } from './utils'

export {
	createOauth2AuthenticationProvider,
	createOauth2AuthorizationProvider,
	createMagicLinkAuthenticationProvider
} from './utils'

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
export { drizzleAdapter } from './providers/drizzle'
