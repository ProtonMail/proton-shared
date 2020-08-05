import { decryptMessage, encryptMessage, getMessage, SessionKey } from 'pmcrypto';

import { setItem, getItem, removeItem } from '../helpers/storage';
import { PersistedSession, PersistedSessionBlob } from './SessionInterface';
import { deserializeUint8Array } from '../helpers/serialization';
import { InvalidPersistentSessionError } from './error';

const getKey = (localID: number) => `S-${localID}`;

export const getSessionKey = (data: Uint8Array) => {
    return {
        data,
        algorithm: 'aes256',
    };
};

export const getEncryptedBlob = async (sessionKey: SessionKey, data: string) => {
    const { data: blob } = await encryptMessage({
        data,
        sessionKey,
        armor: true,
    });
    return blob;
};

export const getDecryptedBlob = async (sessionKey: SessionKey, blob: string) => {
    const { data: result } = await decryptMessage({
        message: await getMessage(blob),
        sessionKeys: [sessionKey],
    });
    return result;
};

interface ForkEncryptedBlob {
    keyPassword: string;
}
export const getForkEncryptedBlob = async (
    sessionKey: SessionKey,
    data: ForkEncryptedBlob
) => {
    return getEncryptedBlob(sessionKey, JSON.stringify(data));
}

export const getForkDecryptedBlob = async (
    sessionKey: SessionKey,
    data: string
): Promise<ForkEncryptedBlob | undefined> => {
    try {
        const string = await getDecryptedBlob(sessionKey, data);
        const parsedValue = JSON.parse(string);
        return {
            keyPassword: parsedValue.keyPassword || '',
        };
    } catch (e) {
        return undefined;
    }
}

export const removePersistedSession = (localID: number) => {
    removeItem(getKey(localID));
}

export const getPersistedSession = (localID: number): PersistedSession | undefined => {
    const itemValue = getItem(getKey(localID));
    if (!itemValue) {
        return;
    }
    try {
        const parsedValue = JSON.parse(itemValue);
        return {
            UID: parsedValue.UID || '',
            blob: parsedValue.blob || '',
        };
    } catch (e) {
        return undefined;
    }
};

export const getPersistedSessionBlob = (blob: string): PersistedSessionBlob | undefined => {
    try {
        const parsedValue = JSON.parse(blob);
        return {
            keyPassword: parsedValue.keyPassword || '',
        };
    } catch (e) {
        return undefined;
    }
};

export const getDecryptedPersistedSessionBlob = async (ClientKey: string, persistedSessionBlobString: string): Promise<PersistedSessionBlob> => {
    const sessionKey = getSessionKey(deserializeUint8Array(ClientKey));
    const blob = await getDecryptedBlob(sessionKey, persistedSessionBlobString).catch(() => {
        throw new InvalidPersistentSessionError('Failed to decrypt persisted blob');
    });
    const persistedSessionBlob = getPersistedSessionBlob(blob);
    if (!persistedSessionBlob) {
        throw new InvalidPersistentSessionError('Failed to parse persisted blob');
    }
    return persistedSessionBlob;
};

export const getEncryptedPersistedSessionBlob = async (ClientKey: string, blob: PersistedSessionBlob) => {
    const sessionKey = getSessionKey(deserializeUint8Array(ClientKey));
    return getEncryptedBlob(sessionKey, JSON.stringify(blob));
}

export const setPersistedSessionWithBlob = async (
    localID: number,
    data: { UID: string; clientKey: string; keyPassword: string }
) => {
    const persistedSession: PersistedSession = {
        UID: data.UID,
        blob: await getEncryptedPersistedSessionBlob(data.clientKey, { keyPassword: data.keyPassword }),
    };
    setItem(getKey(localID), JSON.stringify(persistedSession));
};

export const setPersistedSession = (localID: number, data: { UID: string }) => {
    const persistedSession: PersistedSession = {
        UID: data.UID,
    };
    setItem(getKey(localID), JSON.stringify(persistedSession));
};


