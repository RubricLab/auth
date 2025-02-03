'use client'

import React, { createContext, useContext, type ReactNode } from 'react'
import type { DatabaseProvider } from './types'

const AuthContext = createContext<Awaited<ReturnType<DatabaseProvider['getSession']>>>(null)

export function ClientAuthProvider({
	session,
	children
}: {
	session: Awaited<ReturnType<DatabaseProvider['getSession']>>
	children: ReactNode
}) {
	return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
}

export function useSession() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useSession must be used within a ClientAuthProvider')
	}
	return context
}
