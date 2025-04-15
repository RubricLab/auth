type OAuth2Request = {
    token: string;
    callbackUrl: string;
    expiresAt: Date;
};
type OAuth2AuthorizationRequest = OAuth2Request & {
    userId: string;
};
type OAuth2Account = {
    userId: string;
    provider: string;
    accountId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
};
type MagicLinkRequest = {
    token: string;
    email: string;
    expiresAt: Date;
};
type ApiKeyAuthorizationAccount = {
    userId: string;
    provider: string;
    accountId: string;
    apiKey: string;
};
type GenericUser = {
    id: string;
    email: string;
};
type Session = {
    key: string;
    userId: string;
    expiresAt: Date;
    user?: {
        id: string;
        email: string;
        oAuth2AuthenticationAccounts: Array<{
            provider: string;
            accountId: string;
            accessToken: string;
            refreshToken: string;
            expiresAt: Date;
        }>;
        oAuth2AuthorizationAccounts: Array<{
            provider: string;
            accountId: string;
            accessToken: string;
            refreshToken: string;
            expiresAt: Date;
        }>;
        apiKeyAuthorizationAccounts: Array<{
            provider: string;
            accountId: string;
            apiKey: string;
        }>;
    };
};
export declare function prismaAdapter<TUser extends GenericUser>(db: {
    oAuth2AuthenticationRequest: {
        create: (args: {
            data: OAuth2Request;
        }) => Promise<OAuth2Request>;
        findUniqueOrThrow: (args: {
            where: {
                token: string;
            };
        }) => Promise<OAuth2Request>;
    };
    oAuth2AuthorizationRequest: {
        create: (args: {
            data: OAuth2AuthorizationRequest;
        }) => Promise<OAuth2AuthorizationRequest>;
        findUniqueOrThrow: (args: {
            where: {
                token: string;
            };
        }) => Promise<OAuth2AuthorizationRequest>;
    };
    oAuth2AuthenticationAccount: {
        create: (args: {
            data: OAuth2Account;
        }) => Promise<OAuth2Account>;
        findUniqueOrThrow: (args: {
            where: {
                userId_provider_accountId: {
                    userId: string;
                    provider: string;
                    accountId: string;
                };
            };
        }) => Promise<OAuth2Account>;
        delete: (args: {
            where: {
                userId_provider_accountId: {
                    userId: string;
                    provider: string;
                    accountId: string;
                };
            };
        }) => Promise<OAuth2Account>;
        update: (args: {
            where: {
                userId_provider_accountId: {
                    userId: string;
                    provider: string;
                    accountId: string;
                };
            };
            data: Partial<OAuth2Account>;
        }) => Promise<OAuth2Account>;
    };
    oAuth2AuthorizationAccount: {
        create: (args: {
            data: OAuth2Account;
        }) => Promise<OAuth2Account>;
        findUniqueOrThrow: (args: {
            where: {
                userId_provider_accountId: {
                    userId: string;
                    provider: string;
                    accountId: string;
                };
            };
        }) => Promise<OAuth2Account>;
        delete: (args: {
            where: {
                userId_provider_accountId: {
                    userId: string;
                    provider: string;
                    accountId: string;
                };
            };
        }) => Promise<OAuth2Account>;
        update: (args: {
            where: {
                userId_provider_accountId: {
                    userId: string;
                    provider: string;
                    accountId: string;
                };
            };
            data: Partial<OAuth2Account>;
        }) => Promise<OAuth2Account>;
    };
    apiKeyAuthorizationAccount: {
        create: (args: {
            data: ApiKeyAuthorizationAccount;
        }) => Promise<ApiKeyAuthorizationAccount>;
        findUniqueOrThrow: (args: {
            where: {
                userId_provider_accountId: {
                    userId: string;
                    provider: string;
                    accountId: string;
                };
            };
        }) => Promise<ApiKeyAuthorizationAccount>;
        delete: (args: {
            where: {
                userId_provider_accountId: {
                    userId: string;
                    provider: string;
                    accountId: string;
                };
            };
        }) => Promise<ApiKeyAuthorizationAccount>;
    };
    magicLinkRequest: {
        create: (args: {
            data: MagicLinkRequest;
        }) => Promise<MagicLinkRequest>;
    };
    user: {
        findUnique: (args: {
            where: {
                email: string;
            };
        }) => Promise<TUser | null>;
        create: (args: {
            data: {
                email: string;
            };
        }) => Promise<TUser>;
    };
    session: {
        create: (args: {
            data: Omit<Session, 'key' | 'user'>;
        }) => Promise<Session>;
        findUnique: (args: {
            where: {
                key: string;
            };
            include?: {
                user: {
                    include: {
                        oAuth2AuthenticationAccounts: true;
                        oAuth2AuthorizationAccounts: true;
                        apiKeyAuthorizationAccounts: true;
                    };
                };
            };
        }) => Promise<(Session & {
            user?: TUser;
        }) | null>;
    };
}): {
    createOAuth2AuthenticationRequest: (data: OAuth2Request) => Promise<OAuth2Request>;
    createOAuth2AuthorizationRequest: (data: OAuth2AuthorizationRequest) => Promise<OAuth2AuthorizationRequest>;
    getOAuth2AuthenticationRequest: (data: {
        token: string;
    }) => Promise<OAuth2Request>;
    getOAuth2AuthorizationRequest: (data: {
        token: string;
    }) => Promise<OAuth2AuthorizationRequest>;
    createOAuth2AuthenticationAccount: (data: OAuth2Account) => Promise<OAuth2Account>;
    createMagicLinkRequest: (data: MagicLinkRequest) => Promise<MagicLinkRequest>;
    getUser: (data: {
        email: string;
    }) => Promise<TUser | null>;
    createUser: (data: {
        email: string;
    }) => Promise<TUser>;
    createSession: (data: {
        userId: string;
        expiresAt: Date;
    }) => Promise<Session>;
    getSession: (data: {
        key: string;
    }) => Promise<(Session & {
        user: TUser;
    }) | null>;
    getOAuth2AuthenticationAccount: (data: {
        userId: string;
        provider: string;
        accountId: string;
    }) => Promise<OAuth2Account>;
    updateOAuth2AuthenticationAccount: (data: OAuth2Account) => Promise<OAuth2Account>;
    deleteOAuth2AuthenticationAccount: (data: {
        userId: string;
        provider: string;
        accountId: string;
    }) => Promise<OAuth2Account>;
    getOAuth2AuthorizationAccount: (data: {
        userId: string;
        provider: string;
        accountId: string;
    }) => Promise<OAuth2Account>;
    createOAuth2AuthorizationAccount: (data: OAuth2Account) => Promise<OAuth2Account>;
    deleteOAuth2AuthorizationAccount: (data: {
        userId: string;
        provider: string;
        accountId: string;
    }) => Promise<OAuth2Account>;
    updateOAuth2AuthorizationAccount: (data: OAuth2Account) => Promise<OAuth2Account>;
    createApiKeyAuthorizationAccount: (data: {
        userId: string;
        provider: string;
        accountId: string;
        apiKey: string;
    }) => Promise<ApiKeyAuthorizationAccount>;
    deleteApiKeyAuthorizationAccount: (data: {
        userId: string;
        provider: string;
        accountId: string;
    }) => Promise<ApiKeyAuthorizationAccount>;
};
export {};
