import type {
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
