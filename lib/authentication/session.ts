import { decryptMessage, encryptMessage, getMessage } from 'pmcrypto';

import { setItem, getItem, removeItem } from '../helpers/storage';
import { deserializeUint8Array } from '../helpers/serialization';
import { PersistedSession, PersistedSessionBlob } from './SessionInterface';

const getKey = (localID: number) => `S-${localID}`;

const getLocalSessionKey = (LocalKey: string) => {
    return {
        data: deserializeUint8Array(LocalKey),
        algorithm: 'aes256',
    };
};

export const getEncryptedBlob = async (clientKey: string, data: string) => {
    const sessionKey = getLocalSessionKey(clientKey);
    const { data: blob } = await encryptMessage({
        data,
        sessionKey,
        armor: true,
    });
    return blob;
};

export const getDecryptedBlob = async (clientKey: string, blob: string) => {
    const sessionKey = getLocalSessionKey(clientKey);
    const { data: result } = await decryptMessage({
        message: await getMessage(blob),
        sessionKeys: [sessionKey],
    });
    return result;
};

export const setPersistedSession = (localID: number, data: { UID: string }) => {
    const persistedSession: PersistedSession = {
        UID: data.UID,
    };
    setItem(getKey(localID), JSON.stringify(persistedSession));
};

export const removePersistedSession = (localID: number) => {
    removeItem(getKey(localID));
}

interface ForkEncryptedBlob {
    keyPassword: string;
}
export const getForkEncryptedBlob = async (
    key: string,
    data: ForkEncryptedBlob
) => {
    return getEncryptedBlob(key, JSON.stringify(data));
}

export const getForkDecryptedBlob = async (
    key: string,
    data: string
): Promise<ForkEncryptedBlob | undefined> => {
    try {
        const string = await getDecryptedBlob(key, data);
        const parsedValue = JSON.parse(string);
        return {
            keyPassword: parsedValue.keyPassword || '',
        };
    } catch (e) {
        return undefined;
    }
}

export const setPersistedSessionBlob = async (
    localID: number,
    data: { UID: string; clientKey: string; keyPassword: string }
) => {
    const persistedSessionBlob: PersistedSessionBlob = {
        keyPassword: data.keyPassword,
    };
    const blob = await getEncryptedBlob(data.clientKey, JSON.stringify(persistedSessionBlob));
    const persistedSession: PersistedSession = {
        UID: data.UID,
        blob,
    };
    setItem(getKey(localID), JSON.stringify(persistedSession));
};

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
