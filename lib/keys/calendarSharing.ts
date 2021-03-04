import getRandomValues from 'get-random-values';
import {
    arrayToBinaryString,
    createMessage,
    decryptMessage,
    encryptMessage,
    generateSessionKey,
    getMessage,
    OpenPGPKey,
} from 'pmcrypto';
import { ACCESS_LEVEL } from '../calendar/interface';
import { AES256 } from '../constants';
import { encodeBase64 } from '../helpers/base64';
import { stringToUint8Array, uint8ArrayToString, uint8ArrayToPaddedBase64URLString } from '../helpers/encoding';
import { getSHA256Base64String } from '../helpers/hash';
import { Nullable } from '../interfaces/utils';

export const generateRandomBits = (number: number) => getRandomValues(new Uint8Array(number / 8));

export const keyCharAt = (key: string, i: number) => key.charCodeAt(Math.floor(i % key.length));

const xor = (key: string, data: string) => {
    let result = '';

    for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(keyCharAt(key, i) ^ data.charCodeAt(i));
    }
    return result;
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

export const generateCacheKey = async () => uint8ArrayToPaddedBase64URLString(await generateSessionKey(AES256));
export const generateCacheKeySalt = () => encodeBase64(arrayToBinaryString(generateRandomBits(64)));

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
}) => (encryptedPassphrase ? stringToUint8Array(xor(calendarPassphrase, encryptedPassphrase)) : null);

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
    accessLevel: ACCESS_LEVEL;
    passphraseKey: Nullable<Uint8Array>;
    cacheKey: string;
}) => {
    const encodedCacheKey = encodeURIComponent(cacheKey);

    if (accessLevel === ACCESS_LEVEL.Full && passphraseKey) {
        return `https://calendar.proton.me/api/calendar/v1/url/${urlID}/calendar.ics?CacheKey=${encodedCacheKey}&PassphraseKey=${encodePassphraseKey(
            passphraseKey
        )}`;
    }

    return `https://calendar.proton.me/api/calendar/v1/url/${urlID}/calendar.ics?CacheKey=${encodedCacheKey}`;
};
