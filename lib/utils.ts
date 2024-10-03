import type { Prisma } from '@prisma/client'

import type { AuthProviders } from './types'

export function createAuthActions({
	authProviders,
	db
}: {
	authProviders: AuthProviders
	db: {
		authProvider: Prisma.AuthProviderDelegate
	}
}) {
	return {
		async getAuthUrl({
			userId,
			provider
		}: {
			userId: string
			provider: string
		}) {
			const authProvider = authProviders[provider]

			if (!authProvider) {
				throw new Error(`Auth provider not found for ${provider}`)
			}

			return authProvider.getAuthUrl({ userId })
		},

		async getConnectedAccounts({ userId }: { userId: string }) {
			const connectedAccounts = await db.authProvider.findMany({
				where: { userId }
			})

			return connectedAccounts
		},

		async disconnectAuthProvider({
			userId,
			provider,
			accountId
		}: {
			userId: string
			provider: string
			accountId: string
		}) {
			await db.authProvider.delete({
				where: {
					userId_provider_accountId: {
						userId,
						provider,
						accountId
					}
				}
			})
		}
	}
}
