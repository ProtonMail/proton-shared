export const PASSWORD_WRONG_ERROR = 8002;

export const auth = (data: any) => ({
    method: 'post',
    url: 'auth',
    data,
});

export const auth2FA = ({ totp, u2f }: any) => ({
    method: 'post',
    url: 'auth/2fa',
    data: {
        TwoFactorCode: totp,
        U2F: u2f,
    },
});

export const revoke = () => ({
    method: 'delete',
    url: 'auth',
});

export const setRefreshCookies = () => ({
    method: 'post',
    url: 'auth/refresh',
});

interface CookiesArgs {
    UID: string;
    RefreshToken: string;
    State: string;
    RedirectURI?: string;
}
export const setCookies = ({ UID, RefreshToken, State, RedirectURI = 'https://protonmail.com' }: CookiesArgs) => ({
    method: 'post',
    url: 'auth/cookies',
    data: {
        UID,
        ResponseType: 'token',
        GrantType: 'refresh_token',
        RefreshToken,
        RedirectURI,
        State,
    },
});

export const getLocalKey = () => ({
    method: 'get',
    url: 'auth/sessions/local/key',
});

export const getInfo = (Username?: string) => ({
    method: 'post',
    url: 'auth/info',
    data: Username ? { Username } : undefined,
});

export const getModulus = () => ({
    method: 'get',
    url: 'auth/modulus',
});

export const querySessions = () => ({
    method: 'get',
    url: 'auth/sessions',
});

export const revokeOtherSessions = () => ({
    method: 'delete',
    url: 'auth/sessions',
});

export const revokeSession = (UID: string | number) => ({
    method: 'delete',
    url: `auth/sessions/${UID}`,
});

export const queryScopes = () => ({
    method: 'get',
    url: 'auth/scopes',
});
