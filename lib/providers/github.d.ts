export type GitHubScope = 'read:user' | 'user' | 'user:email' | 'user:follow' | 'repo' | 'repo:status' | 'repo:deployment' | 'public_repo' | 'repo:invite' | 'notifications' | 'gist' | 'read:org' | 'admin:org' | 'write:org' | 'project' | 'read:packages' | 'write:packages' | 'delete:packages' | 'workflow';
export declare const createGithubAuthenticationProvider: ({ githubClientId, githubClientSecret }: {
    githubClientId: string;
    githubClientSecret: string;
}) => import("..").Oauth2AuthenticationProvider;
export declare const createGithubAuthorizationProvider: ({ githubClientId, githubClientSecret, scopes }: {
    githubClientId: string;
    githubClientSecret: string;
    scopes: GitHubScope[];
}) => import("..").Oauth2AuthorizationProvider;
