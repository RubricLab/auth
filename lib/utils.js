"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientAuthProvider = void 0;
exports.createOauth2AuthenticationProvider = createOauth2AuthenticationProvider;
exports.createOauth2AuthorizationProvider = createOauth2AuthorizationProvider;
exports.createMagicLinkAuthenticationProvider = createMagicLinkAuthenticationProvider;
exports.createApiKeyAuthorizationProvider = createApiKeyAuthorizationProvider;
exports.createAuth = createAuth;
const headers_1 = require("next/headers");
const navigation_1 = require("next/navigation");
function createOauth2AuthenticationProvider({ getAuthenticationUrl, getToken, getUser, refreshToken }) {
    return {
        method: 'oauth2',
        getAuthenticationUrl,
        getToken,
        getUser,
        refreshToken
    };
}
function createOauth2AuthorizationProvider({ getAuthorizationUrl, getToken, getUser, refreshToken }) {
    return {
        method: 'oauth2',
        getAuthorizationUrl,
        getToken,
        getUser,
        refreshToken
    };
}
function createMagicLinkAuthenticationProvider({ sendEmail }) {
    return {
        method: 'magiclink',
        sendEmail
    };
}
function createApiKeyAuthorizationProvider({ apiKeyUrl, getUser }) {
    return {
        method: 'apikey',
        apiKeyUrl,
        getUser
    };
}
function createAuth({ oAuth2AuthenticationProviders, magicLinkAuthenticationProviders, oAuth2AuthorizationProviders, apiKeyAuthorizationProviders, databaseProvider, authUrl }) {
    async function refreshOauth2AuthenticationToken({ provider, accountId, userId }) {
        const account = await databaseProvider.getOAuth2AuthenticationAccount({
            provider: String(provider),
            accountId,
            userId
        });
        let authenticationProvider;
        if (oAuth2AuthenticationProviders && provider in oAuth2AuthenticationProviders) {
            authenticationProvider =
                oAuth2AuthenticationProviders[provider];
        }
        if (!authenticationProvider) {
            throw new Error(`Authentication provider ${String(provider)} not found`);
        }
        try {
            const { accessToken, refreshToken: newRefreshToken, expiresAt } = await authenticationProvider.refreshToken({
                refreshToken: account.refreshToken
            });
            return await databaseProvider.updateOAuth2AuthenticationAccount({
                userId: account.userId,
                provider: account.provider,
                accountId: account.accountId,
                accessToken,
                refreshToken: newRefreshToken || account.refreshToken,
                expiresAt
            });
        }
        catch (error) {
            await databaseProvider.deleteOAuth2AuthenticationAccount({
                userId: account.userId,
                provider: account.provider,
                accountId: account.accountId
            });
            throw error;
        }
    }
    async function refreshOauth2AuthorizationToken({ provider, accountId, userId }) {
        const account = await databaseProvider.getOAuth2AuthorizationAccount({
            provider: String(provider),
            accountId,
            userId
        });
        let authorizationProvider;
        if (oAuth2AuthorizationProviders && provider in oAuth2AuthorizationProviders) {
            authorizationProvider =
                oAuth2AuthorizationProviders[provider];
        }
        if (!authorizationProvider) {
            throw new Error(`Authorization provider ${String(provider)} not found`);
        }
        try {
            const { accessToken, refreshToken, expiresAt } = await authorizationProvider.refreshToken({
                refreshToken: account.refreshToken
            });
            return await databaseProvider.updateOAuth2AuthorizationAccount({
                userId: account.userId,
                provider: account.provider,
                accountId: account.accountId,
                accessToken,
                refreshToken: refreshToken || account.refreshToken,
                expiresAt
            });
        }
        catch (error) {
            await databaseProvider.deleteOAuth2AuthorizationAccount({
                provider: account.provider,
                accountId: account.accountId,
                userId: account.userId
            });
            throw error;
        }
    }
    return {
        routes: {
            async GET(request, { params }) {
                const { auth: [method, provider] } = await params;
                const { searchParams } = new URL(request.url);
                const code = searchParams.get('code');
                const state = searchParams.get('state');
                if (!code || !state) {
                    return new Response('Missing code or state parameter', { status: 400 });
                }
                const redirectUri = `${authUrl}/auth/${method}/${String(provider)}`;
                switch (method) {
                    case 'authentication': {
                        let authenticationProvider;
                        if (oAuth2AuthenticationProviders && provider in oAuth2AuthenticationProviders) {
                            authenticationProvider =
                                oAuth2AuthenticationProviders[provider];
                        }
                        if (magicLinkAuthenticationProviders && provider in magicLinkAuthenticationProviders) {
                            authenticationProvider =
                                magicLinkAuthenticationProviders[provider];
                        }
                        if (!authenticationProvider) {
                            throw new Error(`Authentication provider ${String(provider)} not found`);
                        }
                        switch (authenticationProvider.method) {
                            case 'oauth2': {
                                const { accessToken, refreshToken, expiresAt } = await authenticationProvider.getToken({
                                    code,
                                    redirectUri
                                });
                                const { accountId, email } = await authenticationProvider.getUser({
                                    accessToken
                                });
                                const { callbackUrl, expiresAt: requestExpiresAt } = await databaseProvider.getOAuth2AuthenticationRequest({
                                    token: state
                                });
                                if (requestExpiresAt < new Date()) {
                                    throw new Error('Request expired');
                                }
                                let user = await databaseProvider.getUser({ email });
                                if (!user) {
                                    user = await databaseProvider.createUser({ email });
                                    await databaseProvider.createOAuth2AuthenticationAccount({
                                        userId: user.id,
                                        provider: String(provider),
                                        accountId,
                                        accessToken,
                                        refreshToken,
                                        expiresAt
                                    });
                                }
                                const session = await databaseProvider.createSession({
                                    userId: user.id,
                                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
                                });
                                const cookies = await (0, headers_1.cookies)();
                                cookies.set('session', session.key, {
                                    expires: session.expiresAt,
                                    httpOnly: true
                                });
                                return (0, navigation_1.redirect)(callbackUrl);
                            }
                            case 'magiclink': {
                                return new Response('Magic link not yet supported', {
                                    status: 400
                                });
                            }
                        }
                        break;
                    }
                    case 'authorization': {
                        let authorizationProvider;
                        if (oAuth2AuthorizationProviders && provider in oAuth2AuthorizationProviders) {
                            authorizationProvider =
                                oAuth2AuthorizationProviders[provider];
                        }
                        if (!authorizationProvider) {
                            throw new Error(`Authorization provider ${String(provider)} not found`);
                        }
                        switch (authorizationProvider.method) {
                            case 'oauth2': {
                                const { accessToken, refreshToken, expiresAt } = await authorizationProvider.getToken({
                                    code,
                                    redirectUri
                                });
                                const { accountId } = await authorizationProvider.getUser({ accessToken });
                                const { userId, callbackUrl, expiresAt: requestExpiresAt } = await databaseProvider.getOAuth2AuthorizationRequest({
                                    token: state
                                });
                                if (requestExpiresAt < new Date()) {
                                    throw new Error('Request expired');
                                }
                                await databaseProvider.createOAuth2AuthorizationAccount({
                                    userId,
                                    provider: String(provider),
                                    accountId,
                                    accessToken,
                                    refreshToken,
                                    expiresAt
                                });
                                return (0, navigation_1.redirect)(callbackUrl);
                            }
                        }
                        return new Response('Invalid authorization method', { status: 400 });
                    }
                }
                return new Response('Invalid method', { status: 400 });
            }
        },
        actions: {
            async signIn({ provider, callbackUrl }) {
                if (!oAuth2AuthenticationProviders || !oAuth2AuthenticationProviders[provider]) {
                    throw new Error(`OAuth2 provider ${String(provider)} not found`);
                }
                const state = crypto.randomUUID();
                await databaseProvider.createOAuth2AuthenticationRequest({
                    token: state,
                    callbackUrl,
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
                });
                const redirectUri = `${authUrl}/auth/authentication/${String(provider)}`;
                const url = await oAuth2AuthenticationProviders[provider].getAuthenticationUrl({
                    redirectUri,
                    state
                });
                (0, navigation_1.redirect)(url.toString());
            },
            async signOut() {
                const cookies = await (0, headers_1.cookies)();
                cookies.delete('session');
                (0, navigation_1.redirect)('/');
            },
            async sendMagicLink({ provider, email }) {
                if (!magicLinkAuthenticationProviders || !magicLinkAuthenticationProviders[provider]) {
                    throw new Error(`MagicLink provider ${String(provider)} not found`);
                }
                const { token } = await databaseProvider.createMagicLinkRequest({
                    token: crypto.randomUUID(),
                    email,
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
                });
                await magicLinkAuthenticationProviders[provider].sendEmail({
                    email,
                    url: `${authUrl}/auth/authentication/magiclink/${String(provider)}?token=${token}`
                });
                return;
            },
            async refreshOauth2AuthenticationToken({ provider, accountId, userId }) {
                await refreshOauth2AuthenticationToken({
                    provider,
                    accountId,
                    userId
                });
            },
            async refreshOauth2AuthorizationToken({ provider, accountId, userId }) {
                await refreshOauth2AuthorizationToken({
                    provider,
                    accountId,
                    userId
                });
            },
            async getSession() {
                const cookies = await (0, headers_1.cookies)();
                const sessionCookie = cookies.get('session');
                if (!sessionCookie) {
                    return null;
                }
                const session = await databaseProvider.getSession({ key: sessionCookie.value });
                if (!session)
                    return null;
                if (session.expiresAt < new Date()) {
                    cookies.delete('session');
                    return null;
                }
                const refreshedOauth2AuthenticationAccounts = await Promise.all(session.user.oAuth2AuthenticationAccounts.map(async (account) => {
                    if (account.expiresAt < new Date()) {
                        const refreshedAccount = await refreshOauth2AuthenticationToken({
                            provider: account.provider,
                            accountId: account.accountId,
                            userId: session.userId
                        });
                        return refreshedAccount;
                    }
                    return account;
                }));
                const refreshedOauth2AuthorizationAccounts = await Promise.all(session.user.oAuth2AuthorizationAccounts.map(async (account) => {
                    if (account.expiresAt < new Date()) {
                        const refreshedAccount = await refreshOauth2AuthorizationToken({
                            provider: account.provider,
                            accountId: account.accountId,
                            userId: session.userId
                        });
                        return refreshedAccount;
                    }
                    return account;
                }));
                return {
                    ...session,
                    user: {
                        ...session.user,
                        oAuth2AuthenticationAccounts: refreshedOauth2AuthenticationAccounts.map(account => ({
                            provider: account.provider,
                            accountId: account.accountId
                        })),
                        oAuth2AuthorizationAccounts: refreshedOauth2AuthorizationAccounts.map(account => ({
                            provider: account.provider,
                            accountId: account.accountId
                        }))
                    }
                };
            },
            async connectOAuth2AuthorizationAccount({ provider, callbackUrl, userId }) {
                if (!oAuth2AuthorizationProviders || !oAuth2AuthorizationProviders[provider]) {
                    throw new Error(`Authorization provider ${String(provider)} not found`);
                }
                const state = crypto.randomUUID();
                await databaseProvider.createOAuth2AuthorizationRequest({
                    token: state,
                    userId,
                    callbackUrl,
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
                });
                const redirectUri = `${authUrl}/auth/authorization/${String(provider)}`;
                const url = await oAuth2AuthorizationProviders[provider].getAuthorizationUrl({
                    redirectUri,
                    state
                });
                (0, navigation_1.redirect)(url.toString());
            },
            async disconnectOAuth2AuthorizationAccount({ provider, accountId, userId }) {
                if (!oAuth2AuthorizationProviders || !oAuth2AuthorizationProviders[provider]) {
                    throw new Error(`Authorization provider ${String(provider)} not found`);
                }
                await databaseProvider.deleteOAuth2AuthorizationAccount({
                    provider: String(provider),
                    accountId,
                    userId
                });
            },
            async saveAuthorizationAccessToken({ provider, userId, apiKey }) {
                if (!apiKeyAuthorizationProviders || !apiKeyAuthorizationProviders[provider]) {
                    throw new Error(`AccessToken provider ${String(provider)} not found`);
                }
                const { accountId } = await apiKeyAuthorizationProviders[provider].getUser({ apiKey });
                await databaseProvider.createApiKeyAuthorizationAccount({
                    userId,
                    provider: String(provider),
                    accountId,
                    apiKey
                });
            },
            async disconnectApiKeyAuthorizationAccount({ provider, accountId, userId }) {
                if (!apiKeyAuthorizationProviders || !apiKeyAuthorizationProviders[provider]) {
                    throw new Error(`AccessToken provider ${String(provider)} not found`);
                }
                await databaseProvider.deleteApiKeyAuthorizationAccount({
                    provider: String(provider),
                    accountId,
                    userId
                });
            },
            async getAuthConstants() {
                return {
                    ...Object.fromEntries(Object.entries(apiKeyAuthorizationProviders ?? {}).map(([provider, { apiKeyUrl }]) => [
                        `${String(provider).toUpperCase()}_API_KEY_CONFIG_URL`,
                        apiKeyUrl
                    ]))
                };
            }
        },
        __types: {
            TUser: undefined,
            TOAuth2AuthorizationProviders: undefined
        }
    };
}
var client_1 = require("./client");
Object.defineProperty(exports, "ClientAuthProvider", { enumerable: true, get: function () { return client_1.ClientAuthProvider; } });
