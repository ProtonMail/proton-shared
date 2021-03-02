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
import { uint8ArrayToBase64String, uint8ArrayTPaddedBase64URLString } from '../helpers/encoding';
import { getSHA256Base64String } from '../helpers/hash';
import { Nullable } from '../interfaces/utils';

export const generateRandomBits = (number: number) => getRandomValues(new Uint8Array(number / 8));

export const keyCharAt = (key: string, i: number) => key.charCodeAt(Math.floor(i % key.length));

export const xorEncrypt = (key: string, data: string) =>
    Uint8Array.from(data.split('').map((character, index) => character.charCodeAt(0) ^ keyCharAt(key, index)));

export const xorDecrypt = (key: string, data: string) =>
    data
        .split('')
        .map((character, i) => {
            return String.fromCharCode(character.charCodeAt(0) ^ keyCharAt(key, i));
        })
        .join('');

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
    passphraseKey: string;
    decryptedPassphrase: string;
}) => uint8ArrayToBase64String(xorEncrypt(passphraseKey, decryptedPassphrase));

export const generateCacheKey = async () => uint8ArrayTPaddedBase64URLString(await generateSessionKey(AES256));
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
}) => (encryptedPassphrase ? xorDecrypt(calendarPassphrase, encryptedPassphrase) : null);

export const buildLink = async ({
    urlID,
    accessLevel,
    passphraseKey,
    cacheKey,
}: {
    urlID: string;
    accessLevel: ACCESS_LEVEL;
    passphraseKey: Nullable<string>;
    cacheKey: string;
}) => {
    const encodedCacheKey = encodeURIComponent(cacheKey);

    if (accessLevel === ACCESS_LEVEL.Full && passphraseKey) {
        return `https://calendar.proton.me/api/calendar/v1/url/${urlID}/calendar.ics?CacheKey=${encodedCacheKey}&PassphraseKey=${passphraseKey}`;
    }

    return `https://calendar.proton.me/api/calendar/v1/url/${urlID}/calendar.ics?CacheKey=${encodedCacheKey}`;
};
