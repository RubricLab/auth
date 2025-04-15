"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGithubAuthorizationProvider = exports.createGithubAuthenticationProvider = void 0;
const utils_1 = require("../utils");
const createGithubAuthenticationProvider = ({ githubClientId, githubClientSecret }) => (0, utils_1.createOauth2AuthenticationProvider)({
    getAuthenticationUrl: async ({ redirectUri, state }) => {
        const url = new URL('https://github.com/login/oauth/authorize');
        url.searchParams.set('client_id', githubClientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('state', state);
        url.searchParams.set('access_type', 'offline');
        url.searchParams.set('scope', ['read:user', 'user:email'].join(' '));
        return url;
    },
    getToken: async ({ code, redirectUri }) => {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                client_id: githubClientId,
                client_secret: githubClientSecret,
                code,
                redirect_uri: redirectUri
            })
        });
        const data = await response.json();
        if (!response.ok || data.error) {
            console.error('Token exchange failed:', data);
            throw new Error(`Failed to get token: ${data.error_description || data.error}`);
        }
        return {
            accessToken: data.access_token,
            refreshToken: '', // GitHub doesn't provide refresh tokens
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // GitHub tokens don't expire by default
        };
    },
    getUser: async ({ accessToken }) => {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('Failed to get user:', data);
            throw new Error(`Failed to get user: ${data.message}`);
        }
        const emailResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });
        const emails = (await emailResponse.json());
        const primaryEmail = emails.find(email => email.primary)?.email || data.email;
        return {
            accountId: data.id.toString(),
            email: primaryEmail
        };
    },
    refreshToken: async ({ refreshToken: _refreshToken }) => {
        throw new Error('GitHub OAuth tokens do not support refreshing');
    }
});
exports.createGithubAuthenticationProvider = createGithubAuthenticationProvider;
const createGithubAuthorizationProvider = ({ githubClientId, githubClientSecret, scopes }) => (0, utils_1.createOauth2AuthorizationProvider)({
    getAuthorizationUrl: async ({ redirectUri, state }) => {
        const url = new URL('https://github.com/login/oauth/authorize');
        url.searchParams.set('client_id', githubClientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('state', state);
        url.searchParams.set('scope', scopes.join(' '));
        return url;
    },
    getToken: async ({ code, redirectUri }) => {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                client_id: githubClientId,
                client_secret: githubClientSecret,
                code,
                redirect_uri: redirectUri
            })
        });
        const data = await response.json();
        if (!response.ok || data.error) {
            console.error('Token exchange failed:', data);
            throw new Error(`Failed to get token: ${data.error_description || data.error}`);
        }
        return {
            accessToken: data.access_token,
            refreshToken: '', // GitHub doesn't provide refresh tokens
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // GitHub tokens don't expire by default
        };
    },
    getUser: async ({ accessToken }) => {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('Failed to get user:', data);
            throw new Error(`Failed to get user: ${data.message}`);
        }
        const emailResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });
        const emails = (await emailResponse.json());
        const primaryEmail = emails.find(email => email.primary)?.email || data.email;
        return {
            accountId: data.id.toString(),
            email: primaryEmail
        };
    },
    refreshToken: async ({ refreshToken: _refreshToken }) => {
        throw new Error('GitHub OAuth tokens do not support refreshing');
    }
});
exports.createGithubAuthorizationProvider = createGithubAuthorizationProvider;
