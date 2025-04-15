"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientAuthProvider = ClientAuthProvider;
exports.useSession = useSession;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const AuthContext = (0, react_1.createContext)(null);
function ClientAuthProvider({ session, children }) {
    return (0, jsx_runtime_1.jsx)(AuthContext.Provider, { value: session, children: children });
}
function useSession() {
    const context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a ClientAuthProvider');
    }
    return context;
}
