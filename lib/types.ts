// export type AuthUrl = `http${'s' | ''}://${string}${'.' | ':'}${string}`

export type AuthUrl = string
export type Oauth2AuthenticationProvider = {
	method: 'oauth2'
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
}

export type Oauth2AuthorizationProvider = {
	method: 'oauth2'
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
}

export type MagicLinkAuthenticationProvider = {
	method: 'magiclink'
	sendEmail: (options: { email: string; url: string }) => Promise<void>
}

export type AuthenticationProvider = Oauth2AuthenticationProvider | MagicLinkAuthenticationProvider
export type AuthorizationProvider = Oauth2AuthorizationProvider

export type DatabaseProvider = {
	createMagicLinkToken: (data: { email: string; expiresAt: Date }) => Promise<{
		token: string
		email: string
		expiresAt: Date
	}>
	getSession: (data: { key: string }) => Promise<{
		key: string
		userId: string
		expiresAt: Date
		user: {
			oAuth2AuthenticationAccounts: {
				provider: string
				accountId: string
				accessToken: string
				refreshToken: string
				expiresAt: Date
			}[]
			oAuth2AuthorizationAccounts: {
				provider: string
				accountId: string
				accessToken: string
				refreshToken: string
				expiresAt: Date
			}[]
		}
	} | null>
	createOAuth2AuthenticationAccount: (data: {
		userId: string
		provider: string
		accountId: string
		accessToken: string
		refreshToken: string
		expiresAt: Date
	}) => Promise<{
		userId: string
		provider: string
		accountId: string
		accessToken: string
		refreshToken: string
		expiresAt: Date
	}>
	createOAuth2AuthorizationAccount: (data: {
		userId: string
		provider: string
		accountId: string
		accessToken: string
		refreshToken: string
		expiresAt: Date
	}) => Promise<{
		userId: string
		provider: string
		accountId: string
		accessToken: string
		refreshToken: string
		expiresAt: Date
	}>
	getUser: (data: { email: string }) => Promise<{
		id: string
		email: string
	} | null>
	createUser: (data: { email: string }) => Promise<{
		id: string
		email: string
	}>
	createSession: (data: { userId: string; expiresAt: Date }) => Promise<{
		key: string
		userId: string
		expiresAt: Date
	}>
}
