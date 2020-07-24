import { encodeUtf8Base64, decodeUtf8Base64 } from 'pmcrypto';

import { MAILBOX_PASSWORD_KEY, UID_KEY, LOCAL_ID_KEY } from './constants';
import { PersistedSession } from './authentication/SessionInterface';

interface Arguments {
    set: (key: string, value: any) => void;
    get: (key: string) => any;
}

const createAuthenticationStore = ({ set, get }: Arguments) => {
    const setUID = (UID: string) => set(UID_KEY, UID);
    const getUID = (): string => get(UID_KEY);

    const setPassword = (password: string) => set(MAILBOX_PASSWORD_KEY, encodeUtf8Base64(password));
    const getPassword = () => {
        const value = get(MAILBOX_PASSWORD_KEY);
        return value ? decodeUtf8Base64(value) : undefined;
    };

    const setLocalID = (LocalID: number) => set(LOCAL_ID_KEY, LocalID);
    const getLocalID = () => get(LOCAL_ID_KEY);

    const hasSession = () => !!getUID();

    let tmpPersistedSession: PersistedSession;
    const setPersistedSession = (persistedSession: PersistedSession) => {
        tmpPersistedSession = persistedSession;
    }
    const getPersistedSession = () => tmpPersistedSession;

    return {
        getUID,
        setUID,
        setLocalID,
        getLocalID,
        hasSession,
        setPassword,
        getPassword,
        setPersistedSession,
        getPersistedSession,
    };
};

export type AuthenticationStore = ReturnType<typeof createAuthenticationStore>;

export default createAuthenticationStore;
