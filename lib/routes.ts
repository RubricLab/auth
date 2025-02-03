import { cookies as nextCookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type {
	AuthUrl,
	AuthorizationProvider,
	DatabaseProvider,
	MagicLinkAuthenticationProvider,
	Oauth2AuthenticationProvider
} from './types'

export function createAuthRoutes<
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
		async GET(
			request: Request,
			{
				params
			}: {
				params: Promise<{
					auth: [
						method: 'authentication' | 'authorization',
						provider:
							| keyof OAuth2AuthenticationProviders
							| keyof AuthorizationProviders
							| keyof MagicLinkAuthenticationProviders
					]
				}>
			}
		) {
			const { auth } = await params
			const { searchParams } = new URL(request.url)
			const code = searchParams.get('code')
			const state = searchParams.get('state')
			const [method, provider] = auth

			if (!code || !state) {
				return new Response('Missing code or state parameter', { status: 400 })
			}
			const redirectUri = `${authUrl}/auth/${method}/${String(provider)}`

			switch (method) {
				case 'authentication': {
					let authenticationProvider:
						| Oauth2AuthenticationProvider
						| MagicLinkAuthenticationProvider
						| undefined

					if (provider in oAuth2AuthenticationProviders) {
						authenticationProvider =
							oAuth2AuthenticationProviders[provider as keyof OAuth2AuthenticationProviders]
					}
					if (provider in magicLinkAuthenticationProviders) {
						authenticationProvider =
							magicLinkAuthenticationProviders[provider as keyof MagicLinkAuthenticationProviders]
					}

					if (!authenticationProvider) {
						throw new Error(`Authentication provider ${String(provider)} not found`)
					}

					switch (authenticationProvider.method) {
						case 'oauth2': {
							const { accessToken, refreshToken, expiresAt } = await authenticationProvider.getToken({
								code,
								redirectUri
							})
							const { accountId, email } = await authenticationProvider.getUser({
								accessToken
							})

							let user = await databaseProvider.getUser({ email })

							if (!user) {
								user = await databaseProvider.createUser({ email })
								await databaseProvider.createOAuth2AuthenticationAccount({
									userId: user.id,
									provider: String(provider),
									accountId,
									accessToken,
									refreshToken,
									expiresAt
								})
							}

							const session = await databaseProvider.createSession({
								userId: user.id,
								expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day
							})

							const cookies = await nextCookies()

							cookies.set('session', session.key, {
								expires: session.expiresAt,
								httpOnly: true
							})

							redirect('/')
							break
						}
						case 'magiclink': {
							return
						}
					}
					break
				}
				case 'authorization': {
					const authorizationProvider = authorizationProviders[provider as keyof AuthorizationProviders]
					if (!authorizationProvider) {
						throw new Error(`Authorization provider ${String(provider)} not found`)
					}

					switch (authorizationProvider.method) {
						case 'oauth2': {
							const { accessToken, refreshToken, expiresAt } = await authorizationProvider.getToken({
								code,
								redirectUri
							})

							const { accountId } = await authorizationProvider.getUser({ accessToken })

							await databaseProvider.createOAuth2AuthorizationAccount({
								userId: state,
								provider: String(provider),
								accountId,
								accessToken,
								refreshToken,
								expiresAt
							})

							redirect('/')
							break
						}
					}
				}
			}
		}
	}
}
