import { cookies as nextCookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type {
	AuthUrl,
	AuthorizationProvider,
	DatabaseProvider as GenericDatabaseProvider,
	MagicLinkAuthenticationProvider,
	Oauth2AuthenticationProvider,
	Oauth2AuthorizationProvider
} from './types'

export function createOauth2AuthenticationProvider({
	getAuthenticationUrl,
	getToken,
	getUser
}: {
	getAuthenticationUrl: (options: { redirectUri: string }) => Promise<URL>
	getToken: (options: { code: string; redirectUri: string }) => Promise<{
		accessToken: string
		refreshToken: string
		expiresAt: Date
	}>
	getUser: (options: { accessToken: string }) => Promise<{
		accountId: string
		email: string
	}>
}): Oauth2AuthenticationProvider {
	return {
		method: 'oauth2',
		getAuthenticationUrl,
		getToken,
		getUser
	}
}

export function createOauth2AuthorizationProvider({
	getAuthorizationUrl,
	getToken,
	getUser
}: {
	getAuthorizationUrl: (options: { userId: string; redirectUri: string }) => Promise<URL>
	getToken: (options: { code: string; redirectUri: string }) => Promise<{
		accessToken: string
		refreshToken: string
		expiresAt: Date
	}>
	getUser: (options: { accessToken: string }) => Promise<{
		accountId: string
		email: string
	}>
}): Oauth2AuthorizationProvider {
	return {
		method: 'oauth2',
		getAuthorizationUrl,
		getToken,
		getUser
	}
}

export function createMagicLinkAuthenticationProvider({
	sendEmail
}: {
	sendEmail: (options: { email: string; url: string }) => Promise<void>
}): MagicLinkAuthenticationProvider {
	return {
		method: 'magiclink',
		sendEmail
	}
}

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
	oAuth2AuthenticationProviders?: OAuth2AuthenticationProviders
	magicLinkAuthenticationProviders?: MagicLinkAuthenticationProviders
	authorizationProviders?: AuthorizationProviders
	databaseProvider: DatabaseProvider
	authUrl: AuthUrl
}) {
	return {
		routes: {
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

						if (oAuth2AuthenticationProviders && provider in oAuth2AuthenticationProviders) {
							authenticationProvider =
								oAuth2AuthenticationProviders[provider as keyof OAuth2AuthenticationProviders]
						}
						if (magicLinkAuthenticationProviders && provider in magicLinkAuthenticationProviders) {
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
						let authorizationProvider: AuthorizationProvider | undefined

						if (authorizationProviders && provider in authorizationProviders) {
							authorizationProvider = authorizationProviders[provider as keyof AuthorizationProviders]
						}

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
		},
		actions: {
			async signIn({
				provider
			}: {
				provider: keyof OAuth2AuthenticationProviders
			}) {
				if (!oAuth2AuthenticationProviders || !oAuth2AuthenticationProviders[provider]) {
					throw new Error(`OAuth2 provider ${String(provider)} not found`)
				}

				const redirectUri = `${authUrl}/auth/authentication/${String(provider)}`

				const url = await oAuth2AuthenticationProviders[provider].getAuthenticationUrl({ redirectUri })
				redirect(url.toString())
			},

			async signOut() {
				const cookies = await nextCookies()
				cookies.delete('session')
				redirect('/')
			},

			async sendMagicLink({
				provider,
				email
			}: {
				provider: keyof MagicLinkAuthenticationProviders
				email: string
			}) {
				if (!magicLinkAuthenticationProviders || !magicLinkAuthenticationProviders[provider]) {
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
				const cookies = await nextCookies()
				const sessionCookie = cookies.get('session')
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
				if (!authorizationProviders || !authorizationProviders[provider]) {
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
