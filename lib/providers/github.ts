import { createOauth2AuthenticationProvider, createOauth2AuthorizationProvider } from '../utils'

// GitHub OAuth Scopes
// Reference: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps
export type GitHubScope =
	// User scopes
	| 'read:user'
	| 'user'
	| 'user:email'
	| 'user:follow'
	// Repository scopes
	| 'repo'
	| 'repo:status'
	| 'repo:deployment'
	| 'public_repo'
	| 'repo:invite'
	// Notifications and discussions
	| 'notifications'
	// Gists and snippets
	| 'gist'
	// Organization scopes
	| 'read:org'
	| 'admin:org'
	| 'write:org'
	// Projects
	| 'project'
	// Packages
	| 'read:packages'
	| 'write:packages'
	| 'delete:packages'
	// Workflows and Actions
	| 'workflow'

interface GitHubEmail {
	email: string
	primary: boolean
	verified: boolean
	visibility: string | null
}

export const createGithubAuthenticationProvider = ({
	githubClientId,
	githubClientSecret
}: {
	githubClientId: string
	githubClientSecret: string
}) =>
	createOauth2AuthenticationProvider({
		getAuthenticationUrl: async ({ redirectUri, state }) => {
			const url = new URL('https://github.com/login/oauth/authorize')

			url.searchParams.set('client_id', githubClientId)
			url.searchParams.set('redirect_uri', redirectUri)
			url.searchParams.set('state', state)
			url.searchParams.set('access_type', 'offline')
			url.searchParams.set('scope', (['read:user', 'user:email'] satisfies GitHubScope[]).join(' '))

			return url
		},
		getToken: async ({ code, redirectUri }) => {
			const response = await fetch('https://github.com/login/oauth/access_token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({
					client_id: githubClientId,
					client_secret: githubClientSecret,
					code,
					redirect_uri: redirectUri
				})
			})

			const data = await response.json()

			if (!response.ok || data.error) {
				console.error('Token exchange failed:', data)
				throw new Error(`Failed to get token: ${data.error_description || data.error}`)
			}

			return {
				accessToken: data.access_token,
				refreshToken: '', // GitHub doesn't provide refresh tokens
				expiresAt: new Date(Date.now() + 1000 * 60 * 365) // GitHub tokens don't expire by default
			}
		},
		getUser: async ({ accessToken }) => {
			const response = await fetch('https://api.github.com/user', {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: 'application/vnd.github.v3+json'
				}
			})

			const data = await response.json()

			if (!response.ok) {
				console.error('Failed to get user:', data)
				throw new Error(`Failed to get user: ${data.message}`)
			}

			const emailResponse = await fetch('https://api.github.com/user/emails', {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: 'application/vnd.github.v3+json'
				}
			})

			const emails = (await emailResponse.json()) as GitHubEmail[]
			const primaryEmail = emails.find(email => email.primary)?.email || data.email

			return {
				accountId: data.id.toString(),
				email: primaryEmail
			}
		},
		refreshToken: async ({ refreshToken: _refreshToken }) => {
			throw new Error('GitHub OAuth tokens do not support refreshing')
		}
	})

export const createGithubAuthorizationProvider = ({
	githubClientId,
	githubClientSecret,
	scopes
}: {
	githubClientId: string
	githubClientSecret: string
	scopes: GitHubScope[]
}) =>
	createOauth2AuthorizationProvider({
		getAuthorizationUrl: async ({ redirectUri, state }) => {
			const url = new URL('https://github.com/login/oauth/authorize')

			url.searchParams.set('client_id', githubClientId)
			url.searchParams.set('redirect_uri', redirectUri)
			url.searchParams.set('state', state)
			url.searchParams.set('scope', scopes.join(' '))

			return url
		},
		getToken: async ({ code, redirectUri }) => {
			const response = await fetch('https://github.com/login/oauth/access_token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({
					client_id: githubClientId,
					client_secret: githubClientSecret,
					code,
					redirect_uri: redirectUri
				})
			})

			const data = await response.json()

			if (!response.ok || data.error) {
				console.error('Token exchange failed:', data)
				throw new Error(`Failed to get token: ${data.error_description || data.error}`)
			}

			return {
				accessToken: data.access_token,
				refreshToken: '', // GitHub doesn't provide refresh tokens
				expiresAt: new Date(Date.now() + 1000 * 60 * 365) // GitHub tokens don't expire by default
			}
		},
		getUser: async ({ accessToken }) => {
			const response = await fetch('https://api.github.com/user', {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: 'application/vnd.github.v3+json'
				}
			})

			const data = await response.json()

			if (!response.ok) {
				console.error('Failed to get user:', data)
				throw new Error(`Failed to get user: ${data.message}`)
			}

			const emailResponse = await fetch('https://api.github.com/user/emails', {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: 'application/vnd.github.v3+json'
				}
			})

			const emails = (await emailResponse.json()) as GitHubEmail[]
			const primaryEmail = emails.find(email => email.primary)?.email || data.email

			return {
				accountId: data.id.toString(),
				email: primaryEmail
			}
		},
		refreshToken: async ({ refreshToken: _refreshToken }) => {
			throw new Error('GitHub OAuth tokens do not support refreshing')
		}
	})
