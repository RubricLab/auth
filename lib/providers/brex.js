"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBrexAuthenticationProvider = createBrexAuthenticationProvider;
const utils_1 = require("../utils");
function createBrexAuthenticationProvider() {
    return (0, utils_1.createApiKeyAuthorizationProvider)({
        apiKeyUrl: 'https://dashboard.brex.com/settings/developer',
        getUser: async ({ apiKey }) => {
            const response = await fetch('https://platform.brexapis.com/v2/users/me', {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user');
            }
            const { id: accountId } = await response.json();
            return {
                accountId
            };
        }
    });
}
