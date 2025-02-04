import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAuthRoutes } from './routes'
import type {
	AuthUrl,
	AuthorizationProvider,
	DatabaseProvider as GenericDatabaseProvider,
	MagicLinkAuthenticationProvider,
	Oauth2AuthenticationProvider
} from './types'

export function createAuth<
	OAuth2AuthenticationProviders extends Record<string, Oauth2AuthenticationProvider>,
	MagicLinkAuthenticationProviders extends Record<string, MagicLinkAuthenticationProvider>,
	AuthorizationProviders extends Record<string, AuthorizationProvider>,
	DatabaseProvider extends GenericDatabaseProvider
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
		actions: {
			async signIn({
				provider
			}: {
				provider: keyof OAuth2AuthenticationProviders
			}) {
				if (!oAuth2AuthenticationProviders[provider]) {
					throw new Error(`OAuth2 provider ${String(provider)} not found`)
				}

				const redirectUri = `${authUrl}/auth/authentication/${String(provider)}`

				const url = await oAuth2AuthenticationProviders[provider].getAuthenticationUrl({ redirectUri })
				redirect(url.toString())
			},

			async signOut() {
				;(await cookies()).delete('session')
				redirect('/')
			},

			async sendMagicLink({
				provider,
				email
			}: {
				provider: keyof MagicLinkAuthenticationProviders
				email: string
			}) {
				if (!magicLinkAuthenticationProviders[provider]) {
					throw new Error(`MagicLink provider ${String(provider)} not found`)
				}

				const { token } = await databaseProvider.createMagicLinkToken({
					email,
					expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
				})

				await magicLinkAuthenticationProviders[provider].sendEmail({
					email,
					url: `${authUrl}/auth/authentication/magiclink/${String(provider)}?token=${token}`
				})

				return
			},

			async getSession() {
				const sessionCookie = (await cookies()).get('session')
				if (!sessionCookie) {
					return null
				}

				const session = await databaseProvider.getSession({ key: sessionCookie.value })

				return session as Awaited<ReturnType<DatabaseProvider['getSession']>>
			},

			async connect({
				provider,
				userId
			}: {
				provider: keyof AuthorizationProviders
				userId: string
			}) {
				if (!authorizationProviders[provider]) {
					throw new Error(`Authorization provider ${String(provider)} not found`)
				}

				const redirectUri = `${authUrl}/auth/authorization/${String(provider)}`

				const url = await authorizationProviders[provider].getAuthorizationUrl({ userId, redirectUri })
				redirect(url.toString())
			}
		}
	}
}

export { ClientAuthProvider } from './client'
