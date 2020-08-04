import { withAuthHeaders, withUIDHeaders } from '../fetch/headers';
import { getLocalKey, setCookies } from '../api/auth';
import {
    getDecryptedBlob,
    getPersistedSession,
    getPersistedSessionBlob, removePersistedSession, setPersistedSession, setPersistedSessionBlob
} from './session';
import { FORKABLE_APPS } from './constants';
import { APP_NAMES, isSSOMode } from '../constants';
import { Api, User as tsUser } from '../interfaces';
import { LocalKeyResponse } from './interface';
import { getUser } from '../api/user';
import { PersistentSessionInvalid } from './error';
import { getRandomString } from '../helpers/string';

export const getValidatedApp = (app = ''): APP_NAMES | undefined => {
    if (app in FORKABLE_APPS) {
        return FORKABLE_APPS[app as keyof typeof FORKABLE_APPS];
    }
}

export const getValidatedLocalID = (localID = '') => {
    if (!localID) {
        return;
    }
    const maybeLocalID = parseInt(localID, 10);
    if (Number.isInteger(maybeLocalID) && maybeLocalID >= 0 && maybeLocalID <= 100000000) {
        return maybeLocalID;
    }
}

export const getLocalIDPath = (u?: number) => u === undefined ? undefined : `u${u}`;

export const getLocalIDFromPathname = (pathname: string) => {
    const maybeLocalID = pathname.match(/\/u(\d{0,6})\//);
    return getValidatedLocalID(maybeLocalID?.[1]);
};

export const getDecryptedPersistedSessionBlob = async (ClientKey: string, persistedSessionBlobString: string) => {
    const blob = await getDecryptedBlob(ClientKey, persistedSessionBlobString).catch(() => {
        throw new PersistentSessionInvalid();
    });
    const persistedSessionBlob = getPersistedSessionBlob(blob);
    if (!persistedSessionBlob) {
        throw new PersistentSessionInvalid();
    }
    return persistedSessionBlob;
};

export const resumeSession = async (api: Api, localID: number) => {
    const persistedSession = getPersistedSession(localID);
    const persistedUID = persistedSession?.UID;

    // Persistent session is invalid, redirect to re-fork this session
    if (!persistedSession || !persistedUID) {
        removePersistedSession(localID);
        throw new PersistentSessionInvalid();
    }

    // Persistent session to be validated
    const persistedSessionBlobString = persistedSession.blob;

    // User with password
    if (persistedSessionBlobString) {
        try {
            const { ClientKey } = await api<LocalKeyResponse>(withUIDHeaders(persistedUID, getLocalKey()));
            const { keyPassword } = await getDecryptedPersistedSessionBlob(ClientKey, persistedSessionBlobString);
            return { UID: persistedUID, LocalID: localID, keyPassword };
        } catch (e) {
            if (e.name === 'InvalidSession') {
                removePersistedSession(localID);
                throw new PersistentSessionInvalid();
            }
            throw e;
        }
    }

    try {
        // User without password
        const { User } = await api<{ User: tsUser }>(withUIDHeaders(persistedUID, getUser()));
        return { UID: persistedUID, LocalID: localID, User };
    } catch (e) {
        if (e.name === 'InvalidSession') {
            removePersistedSession(localID);
            throw new PersistentSessionInvalid();
        }
        throw e;
    }
}

interface PersistLoginArgs {
    api: Api;
    keyPassword?: string;
    AccessToken: string;
    RefreshToken: string;
    UID: string;
    LocalID: number;
}
export const persistLogin = async ({ api, keyPassword, UID, LocalID, AccessToken, RefreshToken }: PersistLoginArgs) => {
    if (isSSOMode) {
        if (keyPassword) {
            const { ClientKey } = await api<LocalKeyResponse>(withAuthHeaders(UID, AccessToken, getLocalKey()));
            await setPersistedSessionBlob(LocalID, { UID, clientKey: ClientKey, keyPassword });
        } else {
            setPersistedSession(LocalID, { UID });
        }
    }
    await api(withAuthHeaders(UID, AccessToken, setCookies({ UID, RefreshToken, State: getRandomString(24) })));
}
