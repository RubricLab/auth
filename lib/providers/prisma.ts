import type { DatabaseProvider as GenericDatabaseProvider } from '../types'
type OAuth2Request = {
	token: string
	callbackUrl: string
	expiresAt: Date
}

type OAuth2AuthorizationRequest = OAuth2Request & {
	userId: string
}

type OAuth2Account = {
	userId: string
	provider: string
	accountId: string
	accessToken: string
	refreshToken: string
	expiresAt: Date
}

type MagicLinkRequest = {
	token: string
	email: string
	expiresAt: Date
}

type ApiKeyAuthorizationAccount = {
	userId: string
	provider: string
	accountId: string
	apiKey: string
}

type GenericUser = {
	id: string
	email: string
}

type Session = {
	key: string
	userId: string
	expiresAt: Date
	user?: {
		id: string
		email: string
		oAuth2AuthenticationAccounts: Array<{
			provider: string
			accountId: string
			accessToken: string
			refreshToken: string
			expiresAt: Date
		}>
		oAuth2AuthorizationAccounts: Array<{
			provider: string
			accountId: string
			accessToken: string
			refreshToken: string
			expiresAt: Date
		}>
		apiKeyAuthorizationAccounts: Array<{
			provider: string
			accountId: string
			apiKey: string
		}>
	}
}

export function prismaAdapter<TUser extends GenericUser>(db: {
	oAuth2AuthenticationRequest: {
		create: (args: { data: OAuth2Request }) => Promise<OAuth2Request>
		findUniqueOrThrow: (args: { where: { token: string } }) => Promise<OAuth2Request>
	}
	oAuth2AuthorizationRequest: {
		create: (args: { data: OAuth2AuthorizationRequest }) => Promise<OAuth2AuthorizationRequest>
		findUniqueOrThrow: (args: { where: { token: string } }) => Promise<OAuth2AuthorizationRequest>
	}
	oAuth2AuthenticationAccount: {
		create: (args: { data: OAuth2Account }) => Promise<OAuth2Account>
		findUniqueOrThrow: (args: {
			where: { userId_provider_accountId: { userId: string; provider: string; accountId: string } }
		}) => Promise<OAuth2Account>
		delete: (args: {
			where: { userId_provider_accountId: { userId: string; provider: string; accountId: string } }
		}) => Promise<OAuth2Account>
		update: (args: {
			where: { userId_provider_accountId: { userId: string; provider: string; accountId: string } }
			data: Partial<OAuth2Account>
		}) => Promise<OAuth2Account>
	}
	oAuth2AuthorizationAccount: {
		create: (args: { data: OAuth2Account }) => Promise<OAuth2Account>
		findUniqueOrThrow: (args: {
			where: { userId_provider_accountId: { userId: string; provider: string; accountId: string } }
		}) => Promise<OAuth2Account>
		delete: (args: {
			where: { userId_provider_accountId: { userId: string; provider: string; accountId: string } }
		}) => Promise<OAuth2Account>
		update: (args: {
			where: { userId_provider_accountId: { userId: string; provider: string; accountId: string } }
			data: Partial<OAuth2Account>
		}) => Promise<OAuth2Account>
	}
	apiKeyAuthorizationAccount: {
		create: (args: { data: ApiKeyAuthorizationAccount }) => Promise<ApiKeyAuthorizationAccount>
		findUniqueOrThrow: (args: {
			where: { userId_provider_accountId: { userId: string; provider: string; accountId: string } }
		}) => Promise<ApiKeyAuthorizationAccount>
	}
	magicLinkRequest: {
		create: (args: { data: MagicLinkRequest }) => Promise<MagicLinkRequest>
	}
	user: {
		findUnique: (args: { where: { email: string } }) => Promise<TUser | null>
		create: (args: { data: { email: string } }) => Promise<TUser>
	}
	session: {
		create: (args: { data: Omit<Session, 'key' | 'user'> }) => Promise<Session>
		findUnique: (args: {
			where: { key: string }
			include?: {
				user: {
					include: {
						oAuth2AuthenticationAccounts: true
						oAuth2AuthorizationAccounts: true
						apiKeyAuthorizationAccounts: true
					}
				}
			}
		}) => Promise<(Session & { user?: TUser }) | null>
	}
}) {
	return {
		createOAuth2AuthenticationRequest: (data: OAuth2Request) =>
			db.oAuth2AuthenticationRequest.create({ data }),
		createOAuth2AuthorizationRequest: (data: OAuth2AuthorizationRequest) =>
			db.oAuth2AuthorizationRequest.create({ data }),
		getOAuth2AuthenticationRequest: (data: { token: string }) =>
			db.oAuth2AuthenticationRequest.findUniqueOrThrow({ where: { token: data.token } }),
		getOAuth2AuthorizationRequest: (data: { token: string }) =>
			db.oAuth2AuthorizationRequest.findUniqueOrThrow({ where: { token: data.token } }),
		createOAuth2AuthenticationAccount: (data: OAuth2Account) =>
			db.oAuth2AuthenticationAccount.create({ data }),
		createMagicLinkRequest: (data: MagicLinkRequest) => db.magicLinkRequest.create({ data }),
		getUser: (data: { email: string }) => db.user.findUnique({ where: { email: data.email } }),
		createUser: (data: { email: string }) => {
			const { email } = data
			return db.user.create({ data: { email } })
		},
		createSession: (data: { userId: string; expiresAt: Date }) => db.session.create({ data }),
		getSession: (data: { key: string }) =>
			db.session.findUnique({
				where: { key: data.key },
				include: {
					user: {
						include: {
							oAuth2AuthenticationAccounts: true,
							oAuth2AuthorizationAccounts: true,
							apiKeyAuthorizationAccounts: true
						}
					}
				}
			}) as Promise<(Session & { user: TUser }) | null>,
		getOAuth2AuthenticationAccount: (data: { userId: string; provider: string; accountId: string }) =>
			db.oAuth2AuthenticationAccount.findUniqueOrThrow({
				where: {
					userId_provider_accountId: {
						userId: data.userId,
						provider: data.provider,
						accountId: data.accountId
					}
				}
			}),
		updateOAuth2AuthenticationAccount: (data: OAuth2Account) =>
			db.oAuth2AuthenticationAccount.update({
				where: {
					userId_provider_accountId: {
						userId: data.userId,
						provider: data.provider,
						accountId: data.accountId
					}
				},
				data
			}),
		deleteOAuth2AuthenticationAccount: (data: {
			userId: string
			provider: string
			accountId: string
		}) =>
			db.oAuth2AuthenticationAccount.delete({
				where: {
					userId_provider_accountId: {
						userId: data.userId,
						provider: data.provider,
						accountId: data.accountId
					}
				}
			}),
		getOAuth2AuthorizationAccount: (data: { userId: string; provider: string; accountId: string }) =>
			db.oAuth2AuthorizationAccount.findUniqueOrThrow({
				where: {
					userId_provider_accountId: {
						userId: data.userId,
						provider: data.provider,
						accountId: data.accountId
					}
				}
			}),
		createOAuth2AuthorizationAccount: (data: OAuth2Account) =>
			db.oAuth2AuthorizationAccount.create({ data }),
		deleteOAuth2AuthorizationAccount: (data: {
			userId: string
			provider: string
			accountId: string
		}) =>
			db.oAuth2AuthorizationAccount.delete({
				where: {
					userId_provider_accountId: {
						userId: data.userId,
						provider: data.provider,
						accountId: data.accountId
					}
				}
			}),
		updateOAuth2AuthorizationAccount: (data: OAuth2Account) =>
			db.oAuth2AuthorizationAccount.update({
				where: {
					userId_provider_accountId: {
						userId: data.userId,
						provider: data.provider,
						accountId: data.accountId
					}
				},
				data
			}),
		createApiKeyAuthorizationAccount: (data: {
			userId: string
			provider: string
			accountId: string
			apiKey: string
		}) => db.apiKeyAuthorizationAccount.create({ data })
	} satisfies GenericDatabaseProvider
}
