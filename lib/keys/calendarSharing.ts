import getRandomValues from 'get-random-values';
import {
    arrayToBinaryString,
    createMessage,
    decryptMessage,
    encryptMessage,
    generateSessionKey,
    OpenPGPKey,
} from 'pmcrypto';
import { AES256 } from '../constants';
import { encodeBase64 } from '../helpers/base64';
import { hasBit } from '../helpers/bitset';
import { uint8ArrayToBase64String } from '../helpers/encoding';
import { getSHA256Base64String } from '../helpers/hash';
import { CalendarKey, CalendarKeyFlags, Passphrase } from '../interfaces/calendar';
import { Nullable } from '../interfaces/utils';
import { decryptPassphrase } from './calendarKeys';

export const generateRandomBits = (number: number) => getRandomValues(new Uint8Array(number / 8));

export const keyCharAt = (key: string, i: number) => key.charCodeAt(Math.floor(i % key.length));

export const xorEncrypt = (key: string, data: string) =>
    Uint8Array.from(data.split('').map((character, index) => character.charCodeAt(0) ^ keyCharAt(key, index)));

export const decryptPurpose = async ({
    encryptedPurpose,
    privateKeys,
    publicKeys,
}: {
    encryptedPurpose: string;
    privateKeys: OpenPGPKey[];
    publicKeys: OpenPGPKey[];
}) =>
    decryptMessage({
        message: createMessage(encryptedPurpose),
        privateKeys,
        publicKeys,
    });

export const generateEncryptedPurpose = async ({
    purpose,
    publicKeys,
}: // privateKeys,
{
    purpose?: string;
    publicKeys: OpenPGPKey[];
    // privateKeys: OpenPGPKey[];
}) => {
    if (!purpose) {
        return null;
    }

    return (
        await encryptMessage({
            message: createMessage(purpose),
            publicKeys,
            // privateKeys,
        })
    ).data;
};

export const getPassphraseID = (keys: CalendarKey[]) =>
    keys.find(({ Flags }) => hasBit(Flags, CalendarKeyFlags.PRIMARY));

export const getDescryptedPassphrase = ({
    passphrases,
    selfMemberID,
    privateKeys,
    publicKeys,
}: {
    passphrases: Passphrase[];
    selfMemberID: string;
    privateKeys: OpenPGPKey[];
    publicKeys: OpenPGPKey[];
}) => {
    const targetPassphrase = passphrases.find(({ Flags }) => Flags === CalendarKeyFlags.ACTIVE);

    if (!targetPassphrase) {
        throw new Error('Passphrase not found');
    }

    const { MemberPassphrases = [] } = targetPassphrase;
    const memberPassphrase = MemberPassphrases.find(({ MemberID }) => MemberID === selfMemberID);

    if (!memberPassphrase) {
        throw new Error('Member passphrase not found');
    }

    const { Passphrase: armoredPassphrase, Signature: armoredSignature } = memberPassphrase;

    return decryptPassphrase({
        armoredPassphrase,
        armoredSignature,
        publicKeys,
        privateKeys,
    });
};

export const generateEncryptedPassphrase = ({
    passphraseKey,
    decryptedPassphrase,
}: {
    passphraseKey: string;
    decryptedPassphrase: string;
}) => uint8ArrayToBase64String(xorEncrypt(passphraseKey, decryptedPassphrase));

export const generateCacheKey = async () => uint8ArrayToBase64String(await generateSessionKey(AES256));
export const generateCacheKeySalt = () => encodeBase64(arrayToBinaryString(generateRandomBits(64)));

export const getCacheKeyHash = async ({ cacheKey, cacheKeySalt }: { cacheKey: string; cacheKeySalt: string }) =>
    getSHA256Base64String(`${cacheKeySalt}${cacheKey}`);

export const generateEncryptedCacheKey = async ({
    cacheKey,
    publicKeys,
}: // privateKeys,
{
    cacheKey: string;
    publicKeys: OpenPGPKey[];
    // privateKeys: OpenPGPKey[];
}) =>
    (
        await encryptMessage({
            message: createMessage(cacheKey),
            publicKeys,
            // privateKeys,
        })
    ).data;

export const buildApiRequest = () => {
    //
};

export const submitData = () => {
    //
};

export const buildLink = async ({
    urlID,
    accessLevel,
    passphraseKey,
    cacheKey,
}: {
    urlID: string;
    accessLevel: number;
    passphraseKey: Nullable<string>;
    cacheKey: string;
}) => {
    if (accessLevel === 1 && passphraseKey) {
        return `https://calendar.proton.me/api/calendar/v1/url/${urlID}/calendar.ics?CacheKey=${cacheKey}&PassphraseKey=${passphraseKey}`;
    }

    return `https://calendar.proton.me/api/calendar/v1/url/${urlID}/calendar.ics?CacheKey=${cacheKey}`;
};
