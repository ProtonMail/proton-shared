import { withAuthHeaders, withUIDHeaders } from '../fetch/headers';
import { getLocalKey, getLocalSessions, setCookies } from '../api/auth';
import {
    getDecryptedPersistedSessionBlob,
    getPersistedSession,
    getPersistedSessions,
    removePersistedSession,
    setPersistedSession,
    setPersistedSessionWithBlob,
} from './session';
import { isSSOMode } from '../constants';
import { Api, User as tsUser } from '../interfaces';
import { LocalKeyResponse, LocalSessionResponse } from './interface';
import { getUser } from '../api/user';
import { InvalidPersistentSessionError } from './error';
import { getRandomString } from '../helpers/string';
import { getValidatedLocalID } from './validation';
import { getIs401Error } from '../api/helpers/apiErrorHelper';

export const getLocalIDPath = (u?: number) => (u === undefined ? undefined : `u${u}`);

export const getLocalIDFromPathname = (pathname: string) => {
    const maybeLocalID = pathname.match(/\/u(\d{0,6})\/?/);
    return getValidatedLocalID(maybeLocalID?.[1]);
};

export const stripLocalIDFromPathname = (pathname: string) => {
    return pathname.replace(/\/u(\d{0,6})\/?/, '');
};

export const resumeSession = async (api: Api, localID: number) => {
    const persistedSession = getPersistedSession(localID);
    const persistedUID = persistedSession?.UID;

    // Persistent session is invalid, redirect to re-fork this session
    if (!persistedSession || !persistedUID) {
        removePersistedSession(localID);
        throw new InvalidPersistentSessionError('Missing persisted session or UID');
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
            if (getIs401Error(e)) {
                removePersistedSession(localID);
                throw new InvalidPersistentSessionError('Session invalid');
            }
            throw e;
        }
    }

    try {
        // User without password
        const { User } = await api<{ User: tsUser }>(withUIDHeaders(persistedUID, getUser()));
        return { UID: persistedUID, LocalID: localID, User };
    } catch (e) {
        if (getIs401Error(e)) {
            removePersistedSession(localID);
            throw new InvalidPersistentSessionError('Session invalid');
        }
        throw e;
    }
};

interface PersistLoginArgs {
    api: Api;
    keyPassword?: string;
    AccessToken: string;
    RefreshToken: string;
    UID: string;
    LocalID: number;
}
export const persistSession = async ({
    api,
    keyPassword,
    UID,
    LocalID,
    AccessToken,
    RefreshToken,
}: PersistLoginArgs) => {
    if (isSSOMode) {
        if (keyPassword) {
            const { ClientKey } = await api<LocalKeyResponse>(withAuthHeaders(UID, AccessToken, getLocalKey()));
            await setPersistedSessionWithBlob(LocalID, { UID, clientKey: ClientKey, keyPassword });
        } else {
            setPersistedSession(LocalID, { UID });
        }
    }
    await api(withAuthHeaders(UID, AccessToken, setCookies({ UID, RefreshToken, State: getRandomString(24) })));
};

export const getActiveSessions = async (api: Api) => {
    const persistedSessions = getPersistedSessions();
    for (const persistedSession of persistedSessions) {
        try {
            const validatedSession = await resumeSession(api, persistedSession.localID);
            const { Sessions = [] } = await api<{ Sessions: LocalSessionResponse[] }>(
                withUIDHeaders(validatedSession.UID, getLocalSessions())
            );
            return Sessions;
        } catch (e) {
            if (e instanceof InvalidPersistentSessionError || getIs401Error(e)) {
                // Session expired, try another session
                continue;
            }
            // If a network error, throw here to show the error screen
            throw e;
        }
    }
    return [];
};
