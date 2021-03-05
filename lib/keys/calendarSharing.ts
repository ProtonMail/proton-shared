import getRandomValues from 'get-random-values';
import {
    arrayToBinaryString,
    createMessage,
    decodeBase64,
    decryptMessage,
    encryptMessage,
    getMessage,
    OpenPGPKey,
} from 'pmcrypto';
import { AccessLevel } from '../calendar/interface';
import { encodeBase64 } from '../helpers/base64';
import { stringToUint8Array, uint8ArrayToString, uint8ArrayToPaddedBase64URLString } from '../helpers/encoding';
import { getSHA256Base64String } from '../helpers/hash';
import { Nullable } from '../interfaces/utils';

export const generateRandomBits = (number: number) => getRandomValues(new Uint8Array(number / 8));
export const generateRandomBytes = (number: number) => getRandomValues(new Uint8Array(number));

export const keyCharAt = (key: string, i: number) => key.charCodeAt(Math.floor(i % key.length));

const xor = (key: string, data: string) => {
    const Uint8Key = stringToUint8Array(key);
    const Uint8Data = stringToUint8Array(data);

    const xored = new Uint8Array(Uint8Data.length);

    for (let j = 0; j < Uint8Data.length; j++) {
        xored[j] = +Uint8Key[j] ^ +Uint8Data[j];
    }

    // Strip off padding
    let unpaddedLength = Uint8Data.length;
    while (unpaddedLength > 0 && xored[unpaddedLength - 1] === 0) {
        unpaddedLength--;
    }

    return uint8ArrayToString(xored.slice(0, unpaddedLength));
};

export const decryptPurpose = async ({
    encryptedPurpose,
    privateKeys,
}: {
    encryptedPurpose: string;
    privateKeys: OpenPGPKey[];
}) =>
    (
        await decryptMessage({
            message: await getMessage(encryptedPurpose),
            privateKeys,
        })
    ).data;

export const generateEncryptedPurpose = async ({
    purpose,
    publicKeys,
}: {
    purpose?: string;
    publicKeys: OpenPGPKey[];
}) => {
    if (!purpose) {
        return null;
    }

    return (
        await encryptMessage({
            data: purpose,
            publicKeys,
        })
    ).data;
};

export const generateEncryptedPassphrase = ({
    passphraseKey,
    decryptedPassphrase,
}: {
    passphraseKey: Uint8Array;
    decryptedPassphrase: string;
}) => encodeBase64(xor(uint8ArrayToString(passphraseKey), atob(decryptedPassphrase)));

export const generateCacheKey = async () => uint8ArrayToPaddedBase64URLString(generateRandomBytes(16));
export const generateCacheKeySalt = () => encodeBase64(arrayToBinaryString(generateRandomBytes(8)));

export const getCacheKeyHash = async ({ cacheKey, cacheKeySalt }: { cacheKey: string; cacheKeySalt: string }) =>
    getSHA256Base64String(`${cacheKeySalt}${cacheKey}`);

export const generateEncryptedCacheKey = async ({
    cacheKey,
    publicKeys,
}: {
    cacheKey: string;
    publicKeys: OpenPGPKey[];
}) =>
    (
        await encryptMessage({
            message: createMessage(cacheKey),
            publicKeys,
        })
    ).data;

export const decryptCacheKey = async ({
    encryptedCacheKey,
    privateKeys,
}: {
    encryptedCacheKey: string;
    privateKeys: OpenPGPKey[];
}) =>
    (
        await decryptMessage({
            message: await getMessage(encryptedCacheKey),
            privateKeys,
        })
    ).data;

export const getPassphraseKey = ({
    encryptedPassphrase,
    calendarPassphrase,
}: {
    encryptedPassphrase: Nullable<string>;
    calendarPassphrase: string;
}) => {
    if (!encryptedPassphrase) {
        return null;
    }

    return stringToUint8Array(xor(atob(calendarPassphrase), decodeBase64(encryptedPassphrase)));
};

export const encodePassphraseKey = (passphraseKey: Uint8Array) => {
    return uint8ArrayToPaddedBase64URLString(passphraseKey);
};

export const buildLink = async ({
    urlID,
    accessLevel,
    passphraseKey,
    cacheKey,
}: {
    urlID: string;
    accessLevel: AccessLevel;
    passphraseKey: Nullable<Uint8Array>;
    cacheKey: string;
}) => {
    const baseURL = `https://calendar.proton.me/api/calendar/v1/url/${urlID}/calendar.ics`;
    const encodedCacheKey = encodeURIComponent(cacheKey);

    if (accessLevel === AccessLevel.Full && passphraseKey) {
        return `${baseURL}?CacheKey=${encodedCacheKey}&PassphraseKey=${encodePassphraseKey(passphraseKey)}`;
    }

    return `${baseURL}?CacheKey=${encodedCacheKey}`;
};
