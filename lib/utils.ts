import type { Prisma } from '@prisma/client'

import { type AuthProviders, zodSession, zodUser } from './types'

import { cookies } from 'next/headers'

export function createAuthActions({
	authProviders,
	db
}: {
	authProviders: AuthProviders
	db: {
		authProvider: Prisma.AuthProviderDelegate
		user: Prisma.UserDelegate
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
		},

		async getSession() {
			const user = JSON.parse(cookies().get('user')?.value || '{}')

			const sessionKey = cookies().get('key')?.value

			if (!user) {
				return null
			}

			const { data, success } = zodSession.safeParse({
				sessionKey,
				user
			})

			if (!success) {
				return null
			}

			return data
		},
		async getUser(userId: string) {
			const user = await db.user.findUnique({
				where: {
					id: userId
				},
				select: {
					id: true,
					authProviders: {
						select: {
							provider: true,
							accountId: true
						}
					}
				}
			})

			const { data, success } = zodUser.safeParse(user)

			if (!success) {
				return null
			}

			return data
		}
	}
}
