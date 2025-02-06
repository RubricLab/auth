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
	getUser,
	refreshToken
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
	refreshToken: (options: { refreshToken: string }) => Promise<{
		accessToken: string
		refreshToken?: string
		expiresAt: Date
	}>
}): Oauth2AuthenticationProvider {
	return {
		method: 'oauth2',
		getAuthenticationUrl,
		getToken,
		getUser,
		refreshToken
	}
}

export function createOauth2AuthorizationProvider({
	getAuthorizationUrl,
	getToken,
	getUser,
	refreshToken
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
	refreshToken: (options: { refreshToken: string }) => Promise<{
		accessToken: string
		refreshToken?: string
		expiresAt: Date
	}>
}): Oauth2AuthorizationProvider {
	return {
		method: 'oauth2',
		getAuthorizationUrl,
		getToken,
		getUser,
		refreshToken
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
	async function refreshOauth2AuthenticationToken({
		provider,
		accountId,
		userId
	}: {
		provider: keyof OAuth2AuthenticationProviders
		accountId: string
		userId: string
	}) {
		const account = await databaseProvider.getOAuth2AuthenticationAccount({
			provider: String(provider),
			accountId,
			userId
		})

		let authenticationProvider: Oauth2AuthenticationProvider | undefined

		if (oAuth2AuthenticationProviders && provider in oAuth2AuthenticationProviders) {
			authenticationProvider =
				oAuth2AuthenticationProviders[provider as keyof OAuth2AuthenticationProviders]
		}

		if (!authenticationProvider) {
			throw new Error(`Authentication provider ${String(provider)} not found`)
		}

		const {
			accessToken,
			refreshToken: newRefreshToken,
			expiresAt
		} = await authenticationProvider.refreshToken({
			refreshToken: account.refreshToken
		})

		return await databaseProvider.updateOAuth2AuthenticationAccount({
			userId: account.userId,
			provider: account.provider,
			accountId: account.accountId,
			accessToken,
			refreshToken: newRefreshToken || account.refreshToken,
			expiresAt
		})
	}

	async function refreshOauth2AuthorizationToken({
		provider,
		accountId,
		userId
	}: {
		provider: keyof AuthorizationProviders
		accountId: string
		userId: string
	}) {
		const account = await databaseProvider.getOAuth2AuthorizationAccount({
			provider: String(provider),
			accountId,
			userId
		})

		let authorizationProvider: Oauth2AuthorizationProvider | undefined

		if (authorizationProviders && provider in authorizationProviders) {
			authorizationProvider = authorizationProviders[provider as keyof AuthorizationProviders]
		}

		if (!authorizationProvider) {
			throw new Error(`Authorization provider ${String(provider)} not found`)
		}

		const { accessToken, refreshToken, expiresAt } = await authorizationProvider.refreshToken({
			refreshToken: account.refreshToken
		})

		return await databaseProvider.updateOAuth2AuthorizationAccount({
			userId: account.userId,
			provider: account.provider,
			accountId: account.accountId,
			accessToken,
			refreshToken: refreshToken || account.refreshToken,
			expiresAt
		})
	}

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

			async refreshOauth2AuthenticationToken({
				provider,
				accountId,
				userId
			}: {
				provider: keyof OAuth2AuthenticationProviders
				accountId: string
				userId: string
			}) {
				await refreshOauth2AuthenticationToken({
					provider,
					accountId,
					userId
				})
			},
			async refreshOauth2AuthorizationToken({
				provider,
				accountId,
				userId
			}: {
				provider: keyof AuthorizationProviders
				accountId: string
				userId: string
			}) {
				await refreshOauth2AuthorizationToken({
					provider,
					accountId,
					userId
				})
			},

			async getSession() {
				const cookies = await nextCookies()
				const sessionCookie = cookies.get('session')
				if (!sessionCookie) {
					return null
				}

				const session = await databaseProvider.getSession({ key: sessionCookie.value })
				if (!session) return null

				const refreshedOauth2AuthenticationAccounts = await Promise.all(
					session.user.oAuth2AuthenticationAccounts.map(async account => {
						if (account.expiresAt < new Date()) {
							const refreshedAccount = await refreshOauth2AuthenticationToken({
								provider: account.provider,
								accountId: account.accountId,
								userId: session.userId
							})

							return refreshedAccount
						}

						return account
					})
				)

				const refreshedOauth2AuthorizationAccounts = await Promise.all(
					session.user.oAuth2AuthorizationAccounts.map(async account => {
						if (account.expiresAt < new Date()) {
							const refreshedAccount = await refreshOauth2AuthorizationToken({
								provider: account.provider,
								accountId: account.accountId,
								userId: session.userId
							})

							return refreshedAccount
						}

						return account
					})
				)

				return {
					...session,
					user: {
						...session.user,
						oAuth2AuthenticationAccounts: refreshedOauth2AuthenticationAccounts.map(account => ({
							provider: account.provider,
							accountId: account.accountId
						})),
						oAuth2AuthorizationAccounts: refreshedOauth2AuthorizationAccounts.map(account => ({
							provider: account.provider,
							accountId: account.accountId
						}))
					}
				} as Awaited<ReturnType<DatabaseProvider['getSession']>>
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
			},
			async disconnect({
				provider,
				accountId,
				userId
			}: {
				provider: keyof AuthorizationProviders
				accountId: string
				userId: string
			}) {
				if (!authorizationProviders || !authorizationProviders[provider]) {
					throw new Error(`Authorization provider ${String(provider)} not found`)
				}

				await databaseProvider.deleteOAuth2AuthorizationAccount({
					provider: String(provider),
					accountId,
					userId
				})
			}
		}
	}
}

export { ClientAuthProvider } from './client'
