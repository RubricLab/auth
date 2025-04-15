"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResendMagicLinkAuthenticationProvider = void 0;
const resend_1 = require("resend");
const utils_1 = require("../utils");
const createResendMagicLinkAuthenticationProvider = ({ resendApiKey, fromEmail, subject, html }) => {
    const resend = new resend_1.Resend(resendApiKey);
    return (0, utils_1.createMagicLinkAuthenticationProvider)({
        sendEmail: async ({ email, url }) => {
            await resend.emails.send({
                from: fromEmail,
                to: email,
                subject,
                html: html(url)
            });
        }
    });
};
exports.createResendMagicLinkAuthenticationProvider = createResendMagicLinkAuthenticationProvider;
