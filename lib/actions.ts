import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type {
	AuthUrl,
	AuthorizationProvider,
	DatabaseProvider as GenericDatabaseProvider,
	MagicLinkAuthenticationProvider,
	Oauth2AuthenticationProvider
} from './types'

export function createAuthActions<
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
	async function signIn({
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
	}

	async function signOut() {
		;(await cookies()).delete('session')
		redirect('/')
	}

	async function sendMagicLink({
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
	}

	async function getSession() {
		const sessionCookie = (await cookies()).get('session')
		if (!sessionCookie) {
			return null
		}

		const session = await databaseProvider.getSession({ key: sessionCookie.value })

		return session
	}

	async function connect({
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

	return { signIn, sendMagicLink, getSession, connect, signOut }
}
