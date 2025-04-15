"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaAdapter = exports.createBrexAuthenticationProvider = exports.createVercelAuthenticationProvider = exports.createResendMagicLinkAuthenticationProvider = exports.createGithubAuthorizationProvider = exports.createGithubAuthenticationProvider = exports.createGoogleAuthorizationProvider = exports.createGoogleAuthenticationProvider = exports.ClientAuthProvider = exports.createMagicLinkAuthenticationProvider = exports.createOauth2AuthorizationProvider = exports.createOauth2AuthenticationProvider = exports.createAuth = void 0;
// Export all types
__exportStar(require("./types"), exports);
// Export utils
var utils_1 = require("./utils");
Object.defineProperty(exports, "createAuth", { enumerable: true, get: function () { return utils_1.createAuth; } });
var utils_2 = require("./utils");
Object.defineProperty(exports, "createOauth2AuthenticationProvider", { enumerable: true, get: function () { return utils_2.createOauth2AuthenticationProvider; } });
Object.defineProperty(exports, "createOauth2AuthorizationProvider", { enumerable: true, get: function () { return utils_2.createOauth2AuthorizationProvider; } });
Object.defineProperty(exports, "createMagicLinkAuthenticationProvider", { enumerable: true, get: function () { return utils_2.createMagicLinkAuthenticationProvider; } });
// Export client components
var client_1 = require("./client");
Object.defineProperty(exports, "ClientAuthProvider", { enumerable: true, get: function () { return client_1.ClientAuthProvider; } });
// Export provider factories
var google_1 = require("./providers/google");
Object.defineProperty(exports, "createGoogleAuthenticationProvider", { enumerable: true, get: function () { return google_1.createGoogleAuthenticationProvider; } });
Object.defineProperty(exports, "createGoogleAuthorizationProvider", { enumerable: true, get: function () { return google_1.createGoogleAuthorizationProvider; } });
var github_1 = require("./providers/github");
Object.defineProperty(exports, "createGithubAuthenticationProvider", { enumerable: true, get: function () { return github_1.createGithubAuthenticationProvider; } });
Object.defineProperty(exports, "createGithubAuthorizationProvider", { enumerable: true, get: function () { return github_1.createGithubAuthorizationProvider; } });
var resend_1 = require("./providers/resend");
Object.defineProperty(exports, "createResendMagicLinkAuthenticationProvider", { enumerable: true, get: function () { return resend_1.createResendMagicLinkAuthenticationProvider; } });
var vercel_1 = require("./providers/vercel");
Object.defineProperty(exports, "createVercelAuthenticationProvider", { enumerable: true, get: function () { return vercel_1.createVercelAuthenticationProvider; } });
var brex_1 = require("./providers/brex");
Object.defineProperty(exports, "createBrexAuthenticationProvider", { enumerable: true, get: function () { return brex_1.createBrexAuthenticationProvider; } });
var prisma_1 = require("./providers/prisma");
Object.defineProperty(exports, "prismaAdapter", { enumerable: true, get: function () { return prisma_1.prismaAdapter; } });
