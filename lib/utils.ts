import type { Prisma } from '@prisma/client'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { type AuthProviders, type Session, zodSession, zodUser } from './types'

export function createAuthActions({
	authProviders,
	db,
	unauthorizedUrl
}: {
	authProviders: AuthProviders
	db: {
		authProvider: Prisma.AuthProviderDelegate
		user: Prisma.UserDelegate
	}
	unauthorizedUrl: string
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

		async getSession<T extends boolean = true>({
			redirectUnauthorizedUsers = true as T
		}: { redirectUnauthorizedUsers?: T } = {}): Promise<
			T extends true ? Session : Session | undefined
		> {
			const user = JSON.parse((await cookies()).get('user')?.value || '{}')

			const headersList = await headers()
			const referer = headersList?.get('referer') || ''
			const url = new URL(referer)
			const searchParams = new URLSearchParams(url?.search || '')

			const sessionKey = (await cookies()).get('key')?.value

			const { data, success } = zodSession.safeParse({
				sessionKey,
				user
			})

			if (!success && redirectUnauthorizedUsers) {
				redirect(`${unauthorizedUrl}?${searchParams.toString()}`)
			}

			return data as T extends true ? Session : Session | undefined
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
