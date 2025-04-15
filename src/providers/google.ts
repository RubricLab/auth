import { createOauth2AuthenticationProvider, createOauth2AuthorizationProvider } from '../utils'

// Google OAuth Scopes
// Reference: https://developers.google.com/identity/protocols/oauth2/scopes
export type GoogleScope =
	// User info scopes
	| 'https://www.googleapis.com/auth/userinfo.profile'
	| 'https://www.googleapis.com/auth/userinfo.email'
	// Gmail scopes
	| 'https://www.googleapis.com/auth/gmail.readonly'
	| 'https://www.googleapis.com/auth/gmail.modify'
	| 'https://www.googleapis.com/auth/gmail.compose'
	| 'https://www.googleapis.com/auth/gmail.send'
	| 'https://www.googleapis.com/auth/gmail.full'
	// Drive scopes
	| 'https://www.googleapis.com/auth/drive.readonly'
	| 'https://www.googleapis.com/auth/drive.file'
	| 'https://www.googleapis.com/auth/drive'
	| 'https://www.googleapis.com/auth/drive.appdata'
	// Calendar scopes
	| 'https://www.googleapis.com/auth/calendar.readonly'
	| 'https://www.googleapis.com/auth/calendar.events'
	| 'https://www.googleapis.com/auth/calendar'

export const createGoogleAuthenticationProvider = ({
	googleClientId,
	googleClientSecret
}: {
	googleClientId: string
	googleClientSecret: string
}) =>
	createOauth2AuthenticationProvider({
		getAuthenticationUrl: async ({ redirectUri, state }) => {
			const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')

			url.searchParams.set('client_id', googleClientId)
			url.searchParams.set('redirect_uri', redirectUri)
			url.searchParams.set('response_type', 'code')
			url.searchParams.set(
				'scope',
				(
					[
						'https://www.googleapis.com/auth/userinfo.email',
						'https://www.googleapis.com/auth/userinfo.profile'
					] satisfies GoogleScope[]
				).join(' ')
			)
			url.searchParams.set('state', state)
			url.searchParams.set('access_type', 'offline')
			url.searchParams.set('prompt', 'select_account')

			return url
		},
		getToken: async ({ code, redirectUri }) => {
			const response = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					code,
					client_id: googleClientId,
					client_secret: googleClientSecret,
					redirect_uri: redirectUri,
					grant_type: 'authorization_code'
				}).toString()
			})

			const data = await response.json()

			if (!response.ok) {
				console.error('Token exchange failed:', data)
				throw new Error(`Failed to get token: ${data.error}`)
			}

			return {
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
				expiresAt: new Date(Date.now() + data.expires_in * 1000)
			}
		},
		getUser: async ({ accessToken }) => {
			const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
				headers: { Authorization: `Bearer ${accessToken}` }
			})

			const data = await response.json()

			return {
				accountId: data.id,
				email: data.email
			}
		},
		refreshToken: async ({ refreshToken }) => {
			const response = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					client_id: googleClientId,
					client_secret: googleClientSecret,
					refresh_token: refreshToken,
					grant_type: 'refresh_token'
				}).toString()
			})

			const data = await response.json()

			if (!response.ok) {
				console.error('Token refresh failed:', data)
				throw new Error(`Failed to refresh token: ${data.error}`)
			}

			return {
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
				expiresAt: new Date(Date.now() + data.expires_in * 1000)
			}
		}
	})

export const createGoogleAuthorizationProvider = ({
	googleClientId,
	googleClientSecret,
	scopes
}: {
	googleClientId: string
	googleClientSecret: string
	scopes: GoogleScope[]
}) =>
	createOauth2AuthorizationProvider({
		getAuthorizationUrl: async ({ redirectUri, state }) => {
			const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')

			url.searchParams.set('client_id', googleClientId)
			url.searchParams.set('redirect_uri', redirectUri)
			url.searchParams.set('response_type', 'code')
			url.searchParams.set('scope', scopes.join(' '))
			url.searchParams.set('state', state)
			url.searchParams.set('access_type', 'offline')
			url.searchParams.set('prompt', 'consent')

			return url
		},
		getToken: async ({ code, redirectUri }) => {
			const response = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					code,
					client_id: googleClientId,
					client_secret: googleClientSecret,
					redirect_uri: redirectUri,
					grant_type: 'authorization_code'
				}).toString()
			})

			const data = await response.json()

			if (!response.ok) {
				console.error('Token exchange failed:', data)
				throw new Error(`Failed to get token: ${data.error}`)
			}

			return {
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
				expiresAt: new Date(Date.now() + data.expires_in * 1000)
			}
		},
		getUser: async ({ accessToken }) => {
			const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
				headers: { Authorization: `Bearer ${accessToken}` }
			})

			const data = await response.json()

			return {
				accountId: data.id,
				email: data.email
			}
		},
		refreshToken: async ({ refreshToken }) => {
			const response = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					client_id: googleClientId,
					client_secret: googleClientSecret,
					refresh_token: refreshToken,
					grant_type: 'refresh_token'
				}).toString()
			})

			const data = await response.json()

			if (!response.ok) {
				console.error('Token refresh failed:', data)
				throw new Error(`Failed to refresh token: ${data.error}`)
			}

			return {
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
				expiresAt: new Date(Date.now() + data.expires_in * 1000)
			}
		}
	})
