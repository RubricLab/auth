export declare const createResendMagicLinkAuthenticationProvider: <Url extends string>({ resendApiKey, fromEmail, subject, html }: {
    resendApiKey: string;
    fromEmail: `${string}<${string}@${string}.${string}>`;
    subject: string;
    html: (url: Url) => `${string}<a href="${Url}">${string}</a>${string}`;
}) => import("..").MagicLinkAuthenticationProvider;
