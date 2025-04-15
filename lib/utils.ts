import { cookies as nextCookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type {
	ApiKeyAuthorizationProvider,
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
	getAuthenticationUrl: (options: { redirectUri: string; state: string }) => Promise<URL>
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
	getAuthorizationUrl: (options: {
		redirectUri: string
		state: string
	}) => Promise<URL>
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

export function createApiKeyAuthorizationProvider({
	apiKeyUrl,
	getUser
}: {
	apiKeyUrl: string
	getUser: (options: { apiKey: string }) => Promise<{
		accountId: string
	}>
}): ApiKeyAuthorizationProvider {
	return {
		method: 'apikey',
		apiKeyUrl,
		getUser
	}
}
export function createAuth<
	OAuth2AuthenticationProviders extends Record<string, Oauth2AuthenticationProvider>,
	MagicLinkAuthenticationProviders extends Record<string, MagicLinkAuthenticationProvider>,
	OAuth2AuthorizationProviders extends Record<string, Oauth2AuthorizationProvider>,
	ApiKeyAuthorizationProviders extends Record<string, ApiKeyAuthorizationProvider>,
	DatabaseProvider extends GenericDatabaseProvider
>({
	oAuth2AuthenticationProviders,
	magicLinkAuthenticationProviders,
	oAuth2AuthorizationProviders,
	apiKeyAuthorizationProviders,
	databaseProvider,
	authUrl
}: {
	oAuth2AuthenticationProviders?: OAuth2AuthenticationProviders
	magicLinkAuthenticationProviders?: MagicLinkAuthenticationProviders
	oAuth2AuthorizationProviders?: OAuth2AuthorizationProviders
	apiKeyAuthorizationProviders?: ApiKeyAuthorizationProviders
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

		try {
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
		} catch (error) {
			await databaseProvider.deleteOAuth2AuthenticationAccount({
				userId: account.userId,
				provider: account.provider,
				accountId: account.accountId
			})

			throw error
		}
	}

	async function refreshOauth2AuthorizationToken({
		provider,
		accountId,
		userId
	}: {
		provider: keyof OAuth2AuthorizationProviders
		accountId: string
		userId: string
	}) {
		const account = await databaseProvider.getOAuth2AuthorizationAccount({
			provider: String(provider),
			accountId,
			userId
		})

		let authorizationProvider: Oauth2AuthorizationProvider | undefined

		if (oAuth2AuthorizationProviders && provider in oAuth2AuthorizationProviders) {
			authorizationProvider =
				oAuth2AuthorizationProviders[provider as keyof OAuth2AuthorizationProviders]
		}

		if (!authorizationProvider) {
			throw new Error(`Authorization provider ${String(provider)} not found`)
		}

		try {
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
		} catch (error) {
			await databaseProvider.deleteOAuth2AuthorizationAccount({
				provider: account.provider,
				accountId: account.accountId,
				userId: account.userId
			})

			throw error
		}
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
								| keyof OAuth2AuthorizationProviders
								| keyof MagicLinkAuthenticationProviders
						]
					}>
				}
			) {
				const {
					auth: [method, provider]
				} = await params
				const { searchParams } = new URL(request.url)
				const code = searchParams.get('code')
				const state = searchParams.get('state')

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

								const { callbackUrl, expiresAt: requestExpiresAt } =
									await databaseProvider.getOAuth2AuthenticationRequest({
										token: state
									})

								if (requestExpiresAt < new Date()) {
									throw new Error('Request expired')
								}

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
									expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
								})

								const cookies = await nextCookies()

								cookies.set('session', session.key, {
									expires: session.expiresAt,
									httpOnly: true
								})

								return redirect(callbackUrl)
							}
							case 'magiclink': {
								return new Response('Magic link not yet supported', {
									status: 400
								})
							}
						}
						break
					}
					case 'authorization': {
						let authorizationProvider: AuthorizationProvider | undefined

						if (oAuth2AuthorizationProviders && provider in oAuth2AuthorizationProviders) {
							authorizationProvider =
								oAuth2AuthorizationProviders[provider as keyof OAuth2AuthorizationProviders]
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

								const {
									userId,
									callbackUrl,
									expiresAt: requestExpiresAt
								} = await databaseProvider.getOAuth2AuthorizationRequest({
									token: state
								})

								if (requestExpiresAt < new Date()) {
									throw new Error('Request expired')
								}

								await databaseProvider.createOAuth2AuthorizationAccount({
									userId,
									provider: String(provider),
									accountId,
									accessToken,
									refreshToken,
									expiresAt
								})

								return redirect(callbackUrl)
							}
						}
						return new Response('Invalid authorization method', { status: 400 })
					}
				}
				return new Response('Invalid method', { status: 400 })
			}
		},
		actions: {
			async signIn({
				provider,
				callbackUrl
			}: {
				provider: keyof OAuth2AuthenticationProviders
				callbackUrl: string
			}) {
				if (!oAuth2AuthenticationProviders || !oAuth2AuthenticationProviders[provider]) {
					throw new Error(`OAuth2 provider ${String(provider)} not found`)
				}

				const state = crypto.randomUUID()
				await databaseProvider.createOAuth2AuthenticationRequest({
					token: state,
					callbackUrl,
					expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
				})

				const redirectUri = `${authUrl}/auth/authentication/${String(provider)}`

				const url = await oAuth2AuthenticationProviders[provider].getAuthenticationUrl({
					redirectUri,
					state
				})
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

				const { token } = await databaseProvider.createMagicLinkRequest({
					token: crypto.randomUUID(),
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
				provider: keyof OAuth2AuthorizationProviders
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

				if (session.expiresAt < new Date()) {
					cookies.delete('session')
					return null
				}

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

			async connectOAuth2AuthorizationAccount({
				provider,
				callbackUrl,
				userId
			}: {
				provider: keyof OAuth2AuthorizationProviders
				callbackUrl: string
				userId: string
			}) {
				if (!oAuth2AuthorizationProviders || !oAuth2AuthorizationProviders[provider]) {
					throw new Error(`Authorization provider ${String(provider)} not found`)
				}

				const state = crypto.randomUUID()

				await databaseProvider.createOAuth2AuthorizationRequest({
					token: state,
					userId,
					callbackUrl,
					expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
				})

				const redirectUri = `${authUrl}/auth/authorization/${String(provider)}`

				const url = await oAuth2AuthorizationProviders[provider].getAuthorizationUrl({
					redirectUri,
					state
				})
				redirect(url.toString())
			},
			async disconnectOAuth2AuthorizationAccount({
				provider,
				accountId,
				userId
			}: {
				provider: keyof OAuth2AuthorizationProviders
				accountId: string
				userId: string
			}) {
				if (!oAuth2AuthorizationProviders || !oAuth2AuthorizationProviders[provider]) {
					throw new Error(`Authorization provider ${String(provider)} not found`)
				}

				await databaseProvider.deleteOAuth2AuthorizationAccount({
					provider: String(provider),
					accountId,
					userId
				})
			},
			async saveAuthorizationAccessToken({
				provider,
				userId,
				apiKey
			}: {
				provider: keyof ApiKeyAuthorizationProviders
				userId: string
				apiKey: string
			}) {
				if (!apiKeyAuthorizationProviders || !apiKeyAuthorizationProviders[provider]) {
					throw new Error(`AccessToken provider ${String(provider)} not found`)
				}

				const { accountId } = await apiKeyAuthorizationProviders[provider].getUser({ apiKey })

				await databaseProvider.createApiKeyAuthorizationAccount({
					userId,
					provider: String(provider),
					accountId,
					apiKey
				})
			},
			async disconnectApiKeyAuthorizationAccount({
				provider,
				accountId,
				userId
			}: {
				provider: keyof ApiKeyAuthorizationProviders
				accountId: string
				userId: string
			}) {
				if (!apiKeyAuthorizationProviders || !apiKeyAuthorizationProviders[provider]) {
					throw new Error(`AccessToken provider ${String(provider)} not found`)
				}

				await databaseProvider.deleteApiKeyAuthorizationAccount({
					provider: String(provider),
					accountId,
					userId
				})
			},
			async getAuthConstants() {
				return {
					...(Object.fromEntries(
						Object.entries(apiKeyAuthorizationProviders ?? {}).map(([provider, { apiKeyUrl }]) => [
							`${String(provider).toUpperCase()}_API_KEY_CONFIG_URL`,
							apiKeyUrl
						])
					) as {
						[K in keyof ApiKeyAuthorizationProviders as `${Uppercase<string & K>}_API_KEY_CONFIG_URL`]: string
					})
				}
			}
		},
		__types: {
			TUser: undefined as unknown as NonNullable<
				Awaited<ReturnType<DatabaseProvider['getSession']>>
			>['user'],
			TOAuth2AuthorizationProviders: undefined as unknown as keyof OAuth2AuthorizationProviders,
			TSession: undefined as unknown as NonNullable<
				Awaited<ReturnType<DatabaseProvider['getSession']>>
			>
		}
	}
}

export { ClientAuthProvider } from './client'
