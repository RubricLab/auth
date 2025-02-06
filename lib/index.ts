export { createAuth } from './utils'

export {
	createOauth2AuthenticationProvider,
	createOauth2AuthorizationProvider,
	createMagicLinkAuthenticationProvider
} from './utils'

export { ClientAuthProvider } from './client'

export {
	createGoogleAuthenticationProvider,
	createGoogleAuthorizationProvider
} from './providers/google'

export { createResendMagicLinkAuthenticationProvider } from './providers/resend'
