import { createApiKeyAuthorizationProvider } from '../utils'

export function createBrexAuthenticationProvider() {
	return createApiKeyAuthorizationProvider({
		apiKeyUrl: 'https://dashboard.brex.com/settings/developer',
		getUser: async ({ apiKey }) => {
			const response = await fetch('https://platform.brexapis.com/v2/users/me', {
				headers: {
					Authorization: `Bearer ${apiKey}`
				}
			})

			if (!response.ok) {
				throw new Error('Failed to fetch user')
			}

			const { id: accountId } = await response.json()

			return {
				accountId
			}
		}
	})
}
