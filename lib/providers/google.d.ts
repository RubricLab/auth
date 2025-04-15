export type GoogleScope = 'https://www.googleapis.com/auth/userinfo.profile' | 'https://www.googleapis.com/auth/userinfo.email' | 'https://www.googleapis.com/auth/gmail.readonly' | 'https://www.googleapis.com/auth/gmail.modify' | 'https://www.googleapis.com/auth/gmail.compose' | 'https://www.googleapis.com/auth/gmail.send' | 'https://www.googleapis.com/auth/gmail.full' | 'https://www.googleapis.com/auth/drive.readonly' | 'https://www.googleapis.com/auth/drive.file' | 'https://www.googleapis.com/auth/drive' | 'https://www.googleapis.com/auth/drive.appdata' | 'https://www.googleapis.com/auth/calendar.readonly' | 'https://www.googleapis.com/auth/calendar.events' | 'https://www.googleapis.com/auth/calendar';
export declare const createGoogleAuthenticationProvider: ({ googleClientId, googleClientSecret }: {
    googleClientId: string;
    googleClientSecret: string;
}) => import("..").Oauth2AuthenticationProvider;
export declare const createGoogleAuthorizationProvider: ({ googleClientId, googleClientSecret, scopes }: {
    googleClientId: string;
    googleClientSecret: string;
    scopes: GoogleScope[];
}) => import("..").Oauth2AuthorizationProvider;
