'use client'

import React, { createContext, type ReactNode, useContext } from 'react'
import type { DatabaseProvider } from './types'

export function CreateAuthContext<
	Session extends Awaited<ReturnType<DatabaseProvider['getSession']>>
>() {
	const AuthContext = createContext<Session | null>(null)

	return {
		ClientAuthProvider({ session, children }: { session: Session; children: ReactNode }) {
			return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
		},
		useSession() {
			const context = useContext(AuthContext)
			if (context === undefined) {
				throw new Error('useSession must be used within a ClientAuthProvider')
			}
			if (context === null) {
				throw new Error('session is null')
			}
			return context
		}
	}
}
