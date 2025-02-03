import { Resend } from 'resend'
import { createMagicLinkAuthenticationProvider } from '../utils'

export const createResendMagicLinkAuthenticationProvider = <Url extends string>({
	resendApiKey,
	fromEmail,
	subject,
	html
}: {
	resendApiKey: string
	fromEmail: `${string}<${string}@${string}.${string}>`
	subject: string
	html: (url: Url) => `${string}<a href="${Url}">${string}</a>${string}`
}) => {
	const resend = new Resend(resendApiKey)

	return createMagicLinkAuthenticationProvider({
		sendEmail: async ({ email, url }) => {
			await resend.emails.send({
				from: fromEmail,
				to: email,
				subject,
				html: html(url as Url)
			})
		}
	})
}
