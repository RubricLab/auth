export type AuthUrl = string

export type Token = {
	accessToken: string
	refreshToken: string
	expiresAt: Date
}

export type Account = {
	userId: string
	provider: string
	accountId: string
	accessToken: string
	refreshToken: string
	expiresAt: Date
}

export type Session = {
	key: string
	userId: string
	expiresAt: Date
	user: {
		apiKeyAuthorizationAccounts: {
			provider: string
			accountId: string
			apiKey: string
		}[]
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
}

export type Oauth2AuthenticationProvider = {
	method: 'oauth2'
	getAuthenticationUrl: (options: { redirectUri: string; state: string }) => Promise<URL>
	getToken: (options: { code: string; redirectUri: string }) => Promise<Token>
	getUser: (options: { accessToken: string }) => Promise<{
		accountId: string
		email: string
	}>
	refreshToken: (options: { refreshToken: string }) => Promise<{
		accessToken: string
		refreshToken?: string
		expiresAt: Date
	}>
}

export type Oauth2AuthorizationProvider = {
	method: 'oauth2'
	getAuthorizationUrl: (options: {
		redirectUri: string
		state: string
	}) => Promise<URL>
	getToken: (options: { code: string; redirectUri: string }) => Promise<Token>
	getUser: (options: { accessToken: string }) => Promise<{
		accountId: string
		email: string
	}>
	refreshToken: (options: { refreshToken: string }) => Promise<{
		accessToken: string
		refreshToken?: string
		expiresAt: Date
	}>
}

export type MagicLinkAuthenticationProvider = {
	method: 'magiclink'
	sendEmail: (options: { email: string; url: string }) => Promise<void>
}

export type ApiKeyAuthorizationProvider = {
	method: 'apikey'
	apiKeyUrl: string
	getUser: (options: { apiKey: string }) => Promise<{
		accountId: string
	}>
}

export type AuthenticationProvider = Oauth2AuthenticationProvider | MagicLinkAuthenticationProvider
export type AuthorizationProvider = Oauth2AuthorizationProvider | ApiKeyAuthorizationProvider

export type DatabaseProvider = {
	createOAuth2AuthenticationRequest: (data: {
		token: string
		callbackUrl: string
		expiresAt: Date
	}) => Promise<{
		token: string
		callbackUrl: string
		expiresAt: Date
	}>
	createOAuth2AuthorizationRequest: (data: {
		token: string
		userId: string
		callbackUrl: string
		expiresAt: Date
	}) => Promise<{
		token: string
		userId: string
		callbackUrl: string
		expiresAt: Date
	}>
	getOAuth2AuthenticationRequest: (data: { token: string }) => Promise<{
		token: string
		callbackUrl: string
		expiresAt: Date
	}>
	getOAuth2AuthorizationRequest: (data: { token: string }) => Promise<{
		token: string
		userId: string
		callbackUrl: string
		expiresAt: Date
	}>
	createMagicLinkRequest: (data: { token: string; email: string; expiresAt: Date }) => Promise<{
		token: string
		email: string
		expiresAt: Date
	}>
	getSession: (data: { key: string }) => Promise<Session | null>
	getOAuth2AuthenticationAccount: (data: {
		provider: string
		accountId: string
		userId: string
	}) => Promise<Account>
	createOAuth2AuthenticationAccount: (data: Account) => Promise<Account>
	updateOAuth2AuthenticationAccount: (data: Account) => Promise<Account>
	deleteOAuth2AuthenticationAccount: (data: {
		userId: string
		provider: string
		accountId: string
	}) => Promise<Account>
	getOAuth2AuthorizationAccount: (data: {
		provider: string
		accountId: string
		userId: string
	}) => Promise<Account>
	createOAuth2AuthorizationAccount: (data: Account) => Promise<Account>
	deleteOAuth2AuthorizationAccount: (data: {
		provider: string
		accountId: string
		userId: string
	}) => Promise<Account>
	updateOAuth2AuthorizationAccount: (data: Account) => Promise<Account>
	createApiKeyAuthorizationAccount: (data: {
		userId: string
		provider: string
		accountId: string
		apiKey: string
	}) => Promise<{
		userId: string
		provider: string
		accountId: string
		apiKey: string
	}>
	deleteApiKeyAuthorizationAccount: (data: {
		provider: string
		accountId: string
		userId: string
	}) => Promise<{
		userId: string
		provider: string
		accountId: string
		apiKey: string
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
