import isTruthy from './isTruthy';

export const getCookies = (): string[] => {
    try {
        return document.cookie.split(';').map((item) => item.trim());
    } catch (e) {
        return [];
    }
};

export const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts && parts.length === 2) {
        return parts.pop()?.split(';').shift();
    }
};

export const checkCookie = (name: string, value: string) => {
    return getCookies().some((cookie) => cookie.includes(`${name}=${value}`));
};

export interface SetCookieArguments {
    cookieName: string;
    cookieValue: string;
    expirationDate?: string;
    path?: string;
    cookieDomain?: string;
}
export const setCookie = ({ cookieName, cookieValue, expirationDate, path, cookieDomain }: SetCookieArguments) => {
    document.cookie = [
        `${cookieName}=${cookieValue}`,
        expirationDate && `expires=${expirationDate}`,
        cookieDomain && `domain=${cookieDomain}`,
        path && `path=${path}`,
    ]
        .filter(isTruthy)
        .join(';');
};
