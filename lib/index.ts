import { createAuthActions } from './actions'
import { createAuthRoutes } from './routes'
import type {
	AuthUrl,
	AuthorizationProvider,
	DatabaseProvider,
	MagicLinkAuthenticationProvider,
	Oauth2AuthenticationProvider
} from './types'

export function createAuth<
	OAuth2AuthenticationProviders extends Record<string, Oauth2AuthenticationProvider>,
	MagicLinkAuthenticationProviders extends Record<string, MagicLinkAuthenticationProvider>,
	AuthorizationProviders extends Record<string, AuthorizationProvider>
>({
	oAuth2AuthenticationProviders,
	magicLinkAuthenticationProviders,
	authorizationProviders,
	databaseProvider,
	authUrl
}: {
	oAuth2AuthenticationProviders: OAuth2AuthenticationProviders
	magicLinkAuthenticationProviders: MagicLinkAuthenticationProviders
	authorizationProviders: AuthorizationProviders
	databaseProvider: DatabaseProvider
	authUrl: AuthUrl
}) {
	return {
		routes: createAuthRoutes({
			oAuth2AuthenticationProviders,
			magicLinkAuthenticationProviders,
			authorizationProviders,
			databaseProvider,
			authUrl
		}),
		actions: createAuthActions({
			oAuth2AuthenticationProviders,
			magicLinkAuthenticationProviders,
			authorizationProviders,
			databaseProvider,
			authUrl
		})
	}
}
