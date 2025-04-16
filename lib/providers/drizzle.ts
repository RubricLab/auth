import { and, eq } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { pgTable, primaryKey, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import type { Account, DatabaseProvider as GenericDatabaseProvider } from '../types'

const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: varchar('email', { length: 255 }).notNull().unique()
})

const oAuth2AuthenticationRequests = pgTable('oauth2_authentication_requests', {
	token: varchar('token', { length: 255 }).primaryKey(),
	callbackUrl: varchar('callback_url', { length: 255 }).notNull(),
	expiresAt: timestamp('expires_at', { mode: 'date' }).notNull()
})

const oAuth2AuthorizationRequests = pgTable('oauth2_authorization_requests', {
	token: varchar('token', { length: 255 }).primaryKey(),
	userId: varchar('user_id', { length: 36 }).notNull(),
	callbackUrl: varchar('callback_url', { length: 255 }).notNull(),
	expiresAt: timestamp('expires_at', { mode: 'date' }).notNull()
})

const magicLinkRequests = pgTable('magic_link_requests', {
	token: varchar('token', { length: 255 }).primaryKey(),
	email: varchar('email', { length: 255 }).notNull(),
	expiresAt: timestamp('expires_at', { mode: 'date' }).notNull()
})

const oAuth2AuthenticationAccounts = pgTable(
	'oauth2_authentication_accounts',
	{
		userId: varchar('user_id', { length: 36 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		provider: varchar('provider', { length: 255 }).notNull(),
		accountId: varchar('account_id', { length: 255 }).notNull(),
		accessToken: varchar('access_token', { length: 255 }).notNull(),
		refreshToken: varchar('refresh_token', { length: 255 }).notNull(),
		expiresAt: timestamp('expires_at', { mode: 'date' }).notNull()
	},
	table => [primaryKey({ columns: [table.userId, table.provider, table.accountId] })]
)

const oAuth2AuthorizationAccounts = pgTable(
	'oauth2_authorization_accounts',
	{
		userId: varchar('user_id', { length: 36 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		provider: varchar('provider', { length: 255 }).notNull(),
		accountId: varchar('account_id', { length: 255 }).notNull(),
		accessToken: varchar('access_token', { length: 255 }).notNull(),
		refreshToken: varchar('refresh_token', { length: 255 }).notNull(),
		expiresAt: timestamp('expires_at', { mode: 'date' }).notNull()
	},
	table => [primaryKey({ columns: [table.userId, table.provider, table.accountId] })]
)

const apiKeyAuthorizationAccounts = pgTable(
	'api_key_authorization_accounts',
	{
		userId: varchar('user_id', { length: 36 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		provider: varchar('provider', { length: 255 }).notNull(),
		accountId: varchar('account_id', { length: 255 }).notNull(),
		apiKey: varchar('api_key', { length: 255 }).notNull()
	},
	table => [primaryKey({ columns: [table.userId, table.provider, table.accountId] })]
)

const sessions = pgTable('sessions', {
	key: varchar('key', { length: 255 }).primaryKey(),
	userId: varchar('user_id', { length: 36 })
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { mode: 'date' }).notNull()
})

export function drizzleAdapter<TUser extends typeof users>(
	db: NeonHttpDatabase<{
		apiKeyAuthorizationAccounts: typeof apiKeyAuthorizationAccounts
		magicLinkRequests: typeof magicLinkRequests
		oAuth2AuthenticationAccounts: typeof oAuth2AuthenticationAccounts
		oAuth2AuthenticationRequests: typeof oAuth2AuthenticationRequests
		oAuth2AuthorizationAccounts: typeof oAuth2AuthorizationAccounts
		oAuth2AuthorizationRequests: typeof oAuth2AuthorizationRequests
		sessions: typeof sessions
		users: TUser
	}>
) {
	return {
		createOAuth2AuthenticationRequest: async (data: {
			token: string
			callbackUrl: string
			expiresAt: Date
		}) => {
			const [result] = await db.insert(oAuth2AuthenticationRequests).values(data).returning()

			if (!result) {
				throw new Error('Failed to create OAuth2 authentication request')
			}

			return result
		},
		createOAuth2AuthorizationRequest: async (data: {
			token: string
			userId: string
			callbackUrl: string
			expiresAt: Date
		}) => {
			const [result] = await db.insert(oAuth2AuthorizationRequests).values(data).returning()

			if (!result) {
				throw new Error('Failed to create OAuth2 authorization request')
			}

			return result
		},
		getOAuth2AuthenticationRequest: async (data: { token: string }) => {
			const [result] = await db
				.select()
				.from(oAuth2AuthenticationRequests)
				.where(eq(oAuth2AuthenticationRequests.token, data.token))

			if (!result) {
				throw new Error('OAuth2 authentication request not found')
			}

			return result
		},
		getOAuth2AuthorizationRequest: async (data: { token: string }) => {
			const [result] = await db
				.select()
				.from(oAuth2AuthorizationRequests)
				.where(eq(oAuth2AuthorizationRequests.token, data.token))

			if (!result) {
				throw new Error('OAuth2 authorization request not found')
			}

			return result
		},
		createMagicLinkRequest: async (data: { token: string; email: string; expiresAt: Date }) => {
			const [result] = await db.insert(magicLinkRequests).values(data).returning()

			if (!result) {
				throw new Error('Failed to create magic link request')
			}

			return result
		},
		getSession: async (data: { key: string }) => {
			const [session] = await db.select().from(sessions).where(eq(sessions.key, data.key))

			if (!session) return null

			const user = await db.transaction(async tx => {
				const [userRecord] = await tx.select().from(users).where(eq(users.id, session.userId))

				if (!userRecord) {
					throw new Error('User not found')
				}

				const apiKeyAccounts = await tx
					.select()
					.from(apiKeyAuthorizationAccounts)
					.where(eq(apiKeyAuthorizationAccounts.userId, session.userId))

				const oAuth2AuthAccounts = await tx
					.select()
					.from(oAuth2AuthenticationAccounts)
					.where(eq(oAuth2AuthenticationAccounts.userId, session.userId))

				const oAuth2AuthzAccounts = await tx
					.select()
					.from(oAuth2AuthorizationAccounts)
					.where(eq(oAuth2AuthorizationAccounts.userId, session.userId))

				return {
					apiKeyAuthorizationAccounts: apiKeyAccounts,
					oAuth2AuthenticationAccounts: oAuth2AuthAccounts,
					oAuth2AuthorizationAccounts: oAuth2AuthzAccounts
				}
			})

			return {
				...session,
				user: user as {
					apiKeyAuthorizationAccounts: (typeof apiKeyAuthorizationAccounts.$inferSelect)[]
					oAuth2AuthenticationAccounts: (typeof oAuth2AuthenticationAccounts.$inferSelect)[]
					oAuth2AuthorizationAccounts: (typeof oAuth2AuthorizationAccounts.$inferSelect)[]
				} & TUser['$inferSelect']
			}
		},
		getOAuth2AuthenticationAccount: async (data: {
			provider: string
			accountId: string
			userId: string
		}) => {
			const [result] = await db
				.select()
				.from(oAuth2AuthenticationAccounts)
				.where(
					and(
						eq(oAuth2AuthenticationAccounts.provider, data.provider),
						eq(oAuth2AuthenticationAccounts.accountId, data.accountId),
						eq(oAuth2AuthenticationAccounts.userId, data.userId)
					)
				)

			if (!result) {
				throw new Error('OAuth2 authentication account not found')
			}

			return result as Account
		},
		createOAuth2AuthenticationAccount: async (data: Account) => {
			const [result] = await db.insert(oAuth2AuthenticationAccounts).values(data).returning()

			if (!result) {
				throw new Error('Failed to create OAuth2 authentication account')
			}

			return result as Account
		},
		updateOAuth2AuthenticationAccount: async (data: Account) => {
			const [result] = await db
				.update(oAuth2AuthenticationAccounts)
				.set(data)
				.where(
					and(
						eq(oAuth2AuthenticationAccounts.provider, data.provider),
						eq(oAuth2AuthenticationAccounts.accountId, data.accountId),
						eq(oAuth2AuthenticationAccounts.userId, data.userId)
					)
				)
				.returning()

			if (!result) {
				throw new Error('Failed to update OAuth2 authentication account')
			}

			return result as Account
		},
		deleteOAuth2AuthenticationAccount: async (data: {
			userId: string
			provider: string
			accountId: string
		}) => {
			const [result] = await db
				.delete(oAuth2AuthenticationAccounts)
				.where(
					and(
						eq(oAuth2AuthenticationAccounts.provider, data.provider),
						eq(oAuth2AuthenticationAccounts.accountId, data.accountId),
						eq(oAuth2AuthenticationAccounts.userId, data.userId)
					)
				)
				.returning()

			if (!result) {
				throw new Error('Failed to delete OAuth2 authentication account')
			}

			return result as Account
		},
		getOAuth2AuthorizationAccount: async (data: {
			provider: string
			accountId: string
			userId: string
		}) => {
			const [result] = await db
				.select()
				.from(oAuth2AuthorizationAccounts)
				.where(
					and(
						eq(oAuth2AuthorizationAccounts.provider, data.provider),
						eq(oAuth2AuthorizationAccounts.accountId, data.accountId),
						eq(oAuth2AuthorizationAccounts.userId, data.userId)
					)
				)

			if (!result) {
				throw new Error('OAuth2 authorization account not found')
			}

			return result as Account
		},
		createOAuth2AuthorizationAccount: async (data: Account) => {
			const [result] = await db.insert(oAuth2AuthorizationAccounts).values(data).returning()

			if (!result) {
				throw new Error('Failed to create OAuth2 authorization account')
			}

			return result as Account
		},
		deleteOAuth2AuthorizationAccount: async (data: {
			provider: string
			accountId: string
			userId: string
		}) => {
			const [result] = await db
				.delete(oAuth2AuthorizationAccounts)
				.where(
					and(
						eq(oAuth2AuthorizationAccounts.provider, data.provider),
						eq(oAuth2AuthorizationAccounts.accountId, data.accountId),
						eq(oAuth2AuthorizationAccounts.userId, data.userId)
					)
				)
				.returning()

			if (!result) {
				throw new Error('Failed to delete OAuth2 authorization account')
			}

			return result as Account
		},
		updateOAuth2AuthorizationAccount: async (data: Account) => {
			const [result] = await db
				.update(oAuth2AuthorizationAccounts)
				.set(data)
				.where(
					and(
						eq(oAuth2AuthorizationAccounts.provider, data.provider),
						eq(oAuth2AuthorizationAccounts.accountId, data.accountId),
						eq(oAuth2AuthorizationAccounts.userId, data.userId)
					)
				)
				.returning()

			if (!result) {
				throw new Error('Failed to update OAuth2 authorization account')
			}

			return result as Account
		},
		createApiKeyAuthorizationAccount: async (data: {
			userId: string
			provider: string
			accountId: string
			apiKey: string
		}) => {
			const [result] = await db.insert(apiKeyAuthorizationAccounts).values(data).returning()

			if (!result) {
				throw new Error('Failed to create API key authorization account')
			}

			return result
		},
		deleteApiKeyAuthorizationAccount: async (data: {
			provider: string
			accountId: string
			userId: string
		}) => {
			const [result] = await db
				.delete(apiKeyAuthorizationAccounts)
				.where(
					and(
						eq(apiKeyAuthorizationAccounts.provider, data.provider),
						eq(apiKeyAuthorizationAccounts.accountId, data.accountId),
						eq(apiKeyAuthorizationAccounts.userId, data.userId)
					)
				)
				.returning()

			if (!result) {
				throw new Error('Failed to delete API key authorization account')
			}

			return result
		},
		getUser: async (data: { email: string }) => {
			const [user] = await db.select().from(users).where(eq(users.email, data.email))
			return user ? { id: user.id, email: user.email } : null
		},
		createUser: async (data: { email: string }) => {
			const [user] = await db.insert(users).values({ email: data.email }).returning()

			if (!user) {
				throw new Error('Failed to create user')
			}

			return { id: user.id, email: user.email }
		},
		createSession: async (data: { userId: string; expiresAt: Date }) => {
			const key = crypto.randomUUID()
			const [session] = await db
				.insert(sessions)
				.values({ key, ...data })
				.returning()

			if (!session) {
				throw new Error('Failed to create session')
			}

			return session
		}
	} satisfies GenericDatabaseProvider
}
