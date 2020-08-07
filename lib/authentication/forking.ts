import getRandomValues from 'get-random-values';
import { APP_NAMES, APPS, APPS_CONFIGURATION, SSO_AUTHORIZE_PATH, SSO_FORK_PATH } from '../constants';
import { arrayToBinaryString, encodeBase64URL, stripLeadingAndTrailingSlash } from '../helpers/string';
import { replaceUrl } from '../helpers/browser';
import { getAppHref } from '../apps/helper';
import { getValidatedApp, getValidatedLocalID, getValidatedSessionKey } from './validation';
import { getForkDecryptedBlob, getForkEncryptedBlob, getSessionKey } from './session';
import { PullForkResponse, PushForkResponse, RefreshSessionResponse } from './interface';
import { pushForkSession, pullForkSession, setRefreshCookies } from '../api/auth';
import { Api } from '../interfaces';
import { InvalidForkConsumeError } from './error';
import { withUIDHeaders } from '../fetch/headers';
import { stripLocalBasenameFromPathname } from './helper';

interface ForkState {
    sessionKey: string;
    url: string;
}
export const requestFork = (fromApp: APP_NAMES, localID?: number) => {
    const sessionKey = encodeBase64URL(arrayToBinaryString(getRandomValues(new Uint8Array(32))));
    const state = encodeBase64URL(arrayToBinaryString(getRandomValues(new Uint8Array(32))));

    const searchParams = new URLSearchParams();
    searchParams.append('app', fromApp);
    searchParams.append('state', state);
    if (localID !== undefined) {
        searchParams.append('u', `${localID}`);
    }

    const hashParams = new URLSearchParams();
    hashParams.append('sk', sessionKey);

    const forkStateData: ForkState = { sessionKey, url: window.location.href };
    sessionStorage.setItem(`f${state}`, JSON.stringify(forkStateData));

    return replaceUrl(
        getAppHref(`${SSO_AUTHORIZE_PATH}?${searchParams.toString()}#${hashParams.toString()}`, APPS.PROTONACCOUNT)
    );
};

export interface ProduceForkParameters {
    state: string;
    app: APP_NAMES;
    sessionKey: Uint8Array;
}
export interface ProduceForkParametersFull extends ProduceForkParameters {
    localID: number;
}
export const getProduceForkParameters = (): Partial<ProduceForkParametersFull> => {
    const searchParams = new URLSearchParams(window.location.search);
    const app = searchParams.get('app') || '';
    const state = searchParams.get('state') || '';
    const localID = searchParams.get('u') || '';

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const sessionKey = hashParams.get('sk') || '';

    return {
        state: state.slice(0, 100),
        localID: getValidatedLocalID(localID),
        app: getValidatedApp(app),
        sessionKey: getValidatedSessionKey(sessionKey),
    };
};

interface ProduceForkArguments {
    api: Api;
    UID: string;
    keyPassword?: string;
    app: APP_NAMES;
    state: string;
    sessionKey: Uint8Array;
}
export const produceFork = async ({ api, UID, sessionKey, keyPassword, state, app }: ProduceForkArguments) => {
    const payload = keyPassword ? await getForkEncryptedBlob(getSessionKey(sessionKey), { keyPassword }) : undefined;
    const childClientID = APPS_CONFIGURATION[app].clientID;
    const { Selector } = await api<PushForkResponse>(
        withUIDHeaders(
            UID,
            pushForkSession({
                Payload: payload,
                ChildClientID: childClientID,
                Independent: 0,
            })
        )
    );

    const toConsumeParams = new URLSearchParams();
    toConsumeParams.append('selector', Selector);
    toConsumeParams.append('state', state);

    return replaceUrl(getAppHref(`${SSO_FORK_PATH}#${toConsumeParams.toString()}`, app));
};

const getForkStateData = (data?: string | null): ForkState | undefined => {
    if (!data) {
        return undefined;
    }
    try {
        const { url, sessionKey } = JSON.parse(data);
        return {
            url,
            sessionKey,
        };
    } catch (e) {
        return undefined;
    }
};

export const getConsumeForkParameters = () => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const selector = hashParams.get('selector') || '';
    const state = hashParams.get('state') || '';

    return {
        state: state.slice(0, 100),
        selector,
    };
};

const getStrippedPathnameFromURL = (url: string) => {
    try {
        const { pathname } = new URL(url);
        return stripLeadingAndTrailingSlash(stripLocalBasenameFromPathname(pathname));
    } catch (e) {
        return '';
    }
};

interface ConsumeForkArguments {
    api: Api;
    selector: string;
    state: string;
}
export const consumeFork = async ({ selector, api, state }: ConsumeForkArguments) => {
    const stateData = getForkStateData(sessionStorage.getItem(`f${state}`));
    if (!stateData) {
        throw new InvalidForkConsumeError(`Missing state ${state}`);
    }
    const { url, sessionKey: serializedSessionKey } = stateData;
    const sessionKey = getValidatedSessionKey(serializedSessionKey);
    if (!sessionKey || !url) {
        throw new InvalidForkConsumeError('Missing session key or url');
    }
    const { UID, RefreshToken, Payload, LocalID } = await api<PullForkResponse>(pullForkSession(selector));

    let keyPassword: string | undefined;

    if (Payload) {
        try {
            const data = await getForkDecryptedBlob(getSessionKey(sessionKey), Payload);
            keyPassword = data?.keyPassword;
        } catch (e) {
            throw new InvalidForkConsumeError('Failed to decrypt payload');
        }
    }

    const { AccessToken: newAccessToken, RefreshToken: newRefreshToken } = await api<RefreshSessionResponse>(
        withUIDHeaders(UID, setRefreshCookies({ RefreshToken }))
    );

    return {
        UID,
        LocalID,
        keyPassword,
        AccessToken: newAccessToken,
        RefreshToken: newRefreshToken,
        pathname: getStrippedPathnameFromURL(url),
    };
};
