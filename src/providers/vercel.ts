import { createApiKeyAuthorizationProvider } from '../utils'

export function createVercelAuthenticationProvider() {
	return createApiKeyAuthorizationProvider({
		apiKeyUrl: 'https://vercel.com/account/settings/tokens',
		getUser: async ({ apiKey }) => {
			const response = await fetch('https://api.vercel.com/v2/user', {
				headers: {
					Authorization: `Bearer ${apiKey}`,
					Accept: '*/*'
				}
			})

			if (!response.ok) {
				throw new Error('Failed to fetch user')
			}

			const {
				user: { id: accountId }
			} = await response.json()

			return {
				accountId
			}
		}
	})
}
