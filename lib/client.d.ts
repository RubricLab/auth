import { type ReactNode } from 'react';
import type { DatabaseProvider } from './types';
export declare function ClientAuthProvider({ session, children }: {
    session: Awaited<ReturnType<DatabaseProvider['getSession']>>;
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useSession(): import("./types").Session | null;
