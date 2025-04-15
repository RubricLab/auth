import type { ApiKeyAuthorizationProvider, AuthUrl, DatabaseProvider as GenericDatabaseProvider, MagicLinkAuthenticationProvider, Oauth2AuthenticationProvider, Oauth2AuthorizationProvider } from './types';
export declare function createOauth2AuthenticationProvider({ getAuthenticationUrl, getToken, getUser, refreshToken }: {
    getAuthenticationUrl: (options: {
        redirectUri: string;
        state: string;
    }) => Promise<URL>;
    getToken: (options: {
        code: string;
        redirectUri: string;
    }) => Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: Date;
    }>;
    getUser: (options: {
        accessToken: string;
    }) => Promise<{
        accountId: string;
        email: string;
    }>;
    refreshToken: (options: {
        refreshToken: string;
    }) => Promise<{
        accessToken: string;
        refreshToken?: string;
        expiresAt: Date;
    }>;
}): Oauth2AuthenticationProvider;
export declare function createOauth2AuthorizationProvider({ getAuthorizationUrl, getToken, getUser, refreshToken }: {
    getAuthorizationUrl: (options: {
        redirectUri: string;
        state: string;
    }) => Promise<URL>;
    getToken: (options: {
        code: string;
        redirectUri: string;
    }) => Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: Date;
    }>;
    getUser: (options: {
        accessToken: string;
    }) => Promise<{
        accountId: string;
        email: string;
    }>;
    refreshToken: (options: {
        refreshToken: string;
    }) => Promise<{
        accessToken: string;
        refreshToken?: string;
        expiresAt: Date;
    }>;
}): Oauth2AuthorizationProvider;
export declare function createMagicLinkAuthenticationProvider({ sendEmail }: {
    sendEmail: (options: {
        email: string;
        url: string;
    }) => Promise<void>;
}): MagicLinkAuthenticationProvider;
export declare function createApiKeyAuthorizationProvider({ apiKeyUrl, getUser }: {
    apiKeyUrl: string;
    getUser: (options: {
        apiKey: string;
    }) => Promise<{
        accountId: string;
    }>;
}): ApiKeyAuthorizationProvider;
export declare function createAuth<OAuth2AuthenticationProviders extends Record<string, Oauth2AuthenticationProvider>, MagicLinkAuthenticationProviders extends Record<string, MagicLinkAuthenticationProvider>, OAuth2AuthorizationProviders extends Record<string, Oauth2AuthorizationProvider>, ApiKeyAuthorizationProviders extends Record<string, ApiKeyAuthorizationProvider>, DatabaseProvider extends GenericDatabaseProvider>({ oAuth2AuthenticationProviders, magicLinkAuthenticationProviders, oAuth2AuthorizationProviders, apiKeyAuthorizationProviders, databaseProvider, authUrl }: {
    oAuth2AuthenticationProviders?: OAuth2AuthenticationProviders;
    magicLinkAuthenticationProviders?: MagicLinkAuthenticationProviders;
    oAuth2AuthorizationProviders?: OAuth2AuthorizationProviders;
    apiKeyAuthorizationProviders?: ApiKeyAuthorizationProviders;
    databaseProvider: DatabaseProvider;
    authUrl: AuthUrl;
}): {
    routes: {
        GET(request: Request, { params }: {
            params: Promise<{
                auth: [method: "authentication" | "authorization", provider: keyof OAuth2AuthenticationProviders | keyof OAuth2AuthorizationProviders | keyof MagicLinkAuthenticationProviders];
            }>;
        }): Promise<Response>;
    };
    actions: {
        signIn({ provider, callbackUrl }: {
            provider: keyof OAuth2AuthenticationProviders;
            callbackUrl: string;
        }): Promise<never>;
        signOut(): Promise<never>;
        sendMagicLink({ provider, email }: {
            provider: keyof MagicLinkAuthenticationProviders;
            email: string;
        }): Promise<void>;
        refreshOauth2AuthenticationToken({ provider, accountId, userId }: {
            provider: keyof OAuth2AuthenticationProviders;
            accountId: string;
            userId: string;
        }): Promise<void>;
        refreshOauth2AuthorizationToken({ provider, accountId, userId }: {
            provider: keyof OAuth2AuthorizationProviders;
            accountId: string;
            userId: string;
        }): Promise<void>;
        getSession(): Promise<ReturnType<DatabaseProvider["getSession"]> | null>;
        connectOAuth2AuthorizationAccount({ provider, callbackUrl, userId }: {
            provider: keyof OAuth2AuthorizationProviders;
            callbackUrl: string;
            userId: string;
        }): Promise<never>;
        disconnectOAuth2AuthorizationAccount({ provider, accountId, userId }: {
            provider: keyof OAuth2AuthorizationProviders;
            accountId: string;
            userId: string;
        }): Promise<void>;
        saveAuthorizationAccessToken({ provider, userId, apiKey }: {
            provider: keyof ApiKeyAuthorizationProviders;
            userId: string;
            apiKey: string;
        }): Promise<void>;
        disconnectApiKeyAuthorizationAccount({ provider, accountId, userId }: {
            provider: keyof ApiKeyAuthorizationProviders;
            accountId: string;
            userId: string;
        }): Promise<void>;
        getAuthConstants(): Promise<{ [K in keyof ApiKeyAuthorizationProviders as `${Uppercase<string & K>}_API_KEY_CONFIG_URL`]: string; }>;
    };
    __types: {
        TUser: NonNullable<Awaited<ReturnType<DatabaseProvider["getSession"]>>>["user"];
        TOAuth2AuthorizationProviders: keyof OAuth2AuthorizationProviders;
    };
};
export { ClientAuthProvider } from './client';
