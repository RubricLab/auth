"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaAdapter = prismaAdapter;
function prismaAdapter(db) {
    return {
        createOAuth2AuthenticationRequest: (data) => db.oAuth2AuthenticationRequest.create({ data }),
        createOAuth2AuthorizationRequest: (data) => db.oAuth2AuthorizationRequest.create({ data }),
        getOAuth2AuthenticationRequest: (data) => db.oAuth2AuthenticationRequest.findUniqueOrThrow({ where: { token: data.token } }),
        getOAuth2AuthorizationRequest: (data) => db.oAuth2AuthorizationRequest.findUniqueOrThrow({ where: { token: data.token } }),
        createOAuth2AuthenticationAccount: (data) => db.oAuth2AuthenticationAccount.create({ data }),
        createMagicLinkRequest: (data) => db.magicLinkRequest.create({ data }),
        getUser: (data) => db.user.findUnique({ where: { email: data.email } }),
        createUser: (data) => {
            const { email } = data;
            return db.user.create({ data: { email } });
        },
        createSession: (data) => db.session.create({ data }),
        getSession: (data) => db.session.findUnique({
            where: { key: data.key },
            include: {
                user: {
                    include: {
                        oAuth2AuthenticationAccounts: true,
                        oAuth2AuthorizationAccounts: true,
                        apiKeyAuthorizationAccounts: true
                    }
                }
            }
        }),
        getOAuth2AuthenticationAccount: (data) => db.oAuth2AuthenticationAccount.findUniqueOrThrow({
            where: {
                userId_provider_accountId: {
                    userId: data.userId,
                    provider: data.provider,
                    accountId: data.accountId
                }
            }
        }),
        updateOAuth2AuthenticationAccount: (data) => db.oAuth2AuthenticationAccount.update({
            where: {
                userId_provider_accountId: {
                    userId: data.userId,
                    provider: data.provider,
                    accountId: data.accountId
                }
            },
            data
        }),
        deleteOAuth2AuthenticationAccount: (data) => db.oAuth2AuthenticationAccount.delete({
            where: {
                userId_provider_accountId: {
                    userId: data.userId,
                    provider: data.provider,
                    accountId: data.accountId
                }
            }
        }),
        getOAuth2AuthorizationAccount: (data) => db.oAuth2AuthorizationAccount.findUniqueOrThrow({
            where: {
                userId_provider_accountId: {
                    userId: data.userId,
                    provider: data.provider,
                    accountId: data.accountId
                }
            }
        }),
        createOAuth2AuthorizationAccount: (data) => db.oAuth2AuthorizationAccount.create({ data }),
        deleteOAuth2AuthorizationAccount: (data) => db.oAuth2AuthorizationAccount.delete({
            where: {
                userId_provider_accountId: {
                    userId: data.userId,
                    provider: data.provider,
                    accountId: data.accountId
                }
            }
        }),
        updateOAuth2AuthorizationAccount: (data) => db.oAuth2AuthorizationAccount.update({
            where: {
                userId_provider_accountId: {
                    userId: data.userId,
                    provider: data.provider,
                    accountId: data.accountId
                }
            },
            data
        }),
        createApiKeyAuthorizationAccount: (data) => db.apiKeyAuthorizationAccount.create({ data }),
        deleteApiKeyAuthorizationAccount: (data) => db.apiKeyAuthorizationAccount.delete({
            where: {
                userId_provider_accountId: {
                    userId: data.userId,
                    provider: data.provider,
                    accountId: data.accountId
                }
            }
        })
    };
}
