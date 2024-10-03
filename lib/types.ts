import type { PrismaClient } from "@prisma/client";

export interface UserInfo {
	accountId: string;
	label: string;
}

export interface AuthProviderConfig {
	provider: string;
	scopes: string[];
	clientId: string;
	clientSecret: string;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string | null;
	expiresAt: number | null;
}

export interface AuthProvider {
	config: AuthProviderConfig;
	getAuthUrl: ({ userId }: { userId: string }) => string;
	getTokensFromCode({ code }: { code: string }): Promise<AuthTokens>;
	getAccessToken({
		userId,
		accountId,
	}: {
		userId: string;
		accountId: string;
	}): Promise<{ accessToken: string }>;
	getUserInfo({ token }: { token: string }): Promise<UserInfo>;
}

export type AuthProviders = {
	[provider in string]?: AuthProvider;
};

export interface User {
	id: string;
}

export interface WebhookInfo {
	id: string;
	type: string;
	enabled: boolean;
}

export type DB = PrismaClient;
