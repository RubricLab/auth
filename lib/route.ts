import { type NextRequest, NextResponse } from 'next/server'
import type { AuthProvider, AuthProviders, AuthTokens, DB, UserInfo } from './types'

async function connectAuthProvider({
	userId,
	userInfo,
	provider,
	authTokens,
	db
}: {
	userId: string
	userInfo: UserInfo
	provider: AuthProvider
	authTokens: AuthTokens
	db: DB
}) {
	await db.authProvider.upsert({
		where: {
			userId_provider_accountId: {
				provider: provider.config.provider,
				userId,
				accountId: userInfo.accountId
			}
		},
		update: {
			accessToken: authTokens.accessToken,
			refreshToken: authTokens.refreshToken,
			expiresAt: authTokens.expiresAt ? new Date(authTokens.expiresAt) : null
		},
		create: {
			provider: provider.config.provider,
			accountId: userInfo.accountId,
			label: userInfo.label,
			scopes: provider.config.scopes,
			accessToken: authTokens.accessToken,
			refreshToken: authTokens.refreshToken,
			expiresAt: authTokens.expiresAt ? new Date(authTokens.expiresAt) : null,
			userId
		}
	})
}

export function createAuthCallbackHandler({
	authProviders,
	db,
	url
}: {
	authProviders: AuthProviders
	db: DB
	url: string
}) {
	return async (
		request: NextRequest,
		{ params }: { params: { provider: keyof AuthProviders } }
	): Promise<NextResponse> => {
		const provider = authProviders[params.provider]
		if (!provider) {
			return NextResponse.redirect(`${url}?error=InvalidProvider`)
		}
		const code = request.nextUrl.searchParams.get('code')
		if (!code) {
			return NextResponse.redirect(`${url}?error=NoCodeProvided`)
		}

		const userId = request.nextUrl.searchParams.get('state')
		if (!userId) {
			return NextResponse.redirect(`${url}?error=NoUserIdProvided`)
		}

		try {
			const authTokens = await provider.getTokensFromCode({ code })
			const userInfo = await provider.getUserInfo({
				token: authTokens.accessToken
			})

			await connectAuthProvider({ userId, provider, authTokens, userInfo, db })

			return NextResponse.redirect(`${url}?success=true`)
		} catch (error) {
			console.error(`Error during ${provider.config.provider} auth callback:`, error)
			return NextResponse.redirect(`${url}?error=AuthFailed`)
		}
	}
}
