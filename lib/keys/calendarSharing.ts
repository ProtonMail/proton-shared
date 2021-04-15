import {
    arrayToBinaryString,
    createMessage,
    decodeBase64,
    decryptMessage,
    encryptMessage,
    getMessage,
    OpenPGPKey,
} from 'pmcrypto';
import { ACCESS_LEVEL } from '../interfaces/calendar';
import { encodeBase64 } from '../helpers/base64';
import { stringToUint8Array, uint8ArrayToString, uint8ArrayToPaddedBase64URLString } from '../helpers/encoding';
import { getSHA256Base64String, generateRandomBytes, xorEncryptDecrypt } from '../helpers/crypto';
import { Nullable } from '../interfaces/utils';

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
}) =>
    encodeBase64(
        xorEncryptDecrypt({ key: uint8ArrayToString(passphraseKey), data: decodeBase64(decryptedPassphrase) })
    );

export const generateCacheKey = () => uint8ArrayToPaddedBase64URLString(generateRandomBytes(16));
export const generateCacheKeySalt = () => encodeBase64(arrayToBinaryString(generateRandomBytes(8)));

export const getCacheKeyHash = ({ cacheKey, cacheKeySalt }: { cacheKey: string; cacheKeySalt: string }) =>
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

    return stringToUint8Array(
        xorEncryptDecrypt({ key: decodeBase64(calendarPassphrase), data: decodeBase64(encryptedPassphrase) })
    );
};

export const buildLink = ({
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
    const baseURL = `https://calendar.protonmail.com/api/calendar/v1/url/${urlID}/calendar.ics`;
    const encodedCacheKey = encodeURIComponent(cacheKey);

    if (accessLevel === ACCESS_LEVEL.FULL && passphraseKey) {
        const encodedPassphraseKey = encodeURIComponent(uint8ArrayToPaddedBase64URLString(passphraseKey));

        return `${baseURL}?CacheKey=${encodedCacheKey}&PassphraseKey=${encodedPassphraseKey}`;
    }

    return `${baseURL}?CacheKey=${encodedCacheKey}`;
};
