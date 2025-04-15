"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVercelAuthenticationProvider = createVercelAuthenticationProvider;
const utils_1 = require("../utils");
function createVercelAuthenticationProvider() {
    return (0, utils_1.createApiKeyAuthorizationProvider)({
        apiKeyUrl: 'https://vercel.com/account/settings/tokens',
        getUser: async ({ apiKey }) => {
            const response = await fetch('https://api.vercel.com/v2/user', {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    Accept: '*/*'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user');
            }
            const { user: { id: accountId } } = await response.json();
            return {
                accountId
            };
        }
    });
}
