'use client'

import React, { createContext, useContext, type ReactNode } from 'react'
import type { Session } from './types'

const AuthContext = createContext<Session | undefined>(undefined)

export const ClientAuthProvider = ({
	session,
	children
}: { session?: Session; children: ReactNode }) => {
	return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
}

export const useSession = () => {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
