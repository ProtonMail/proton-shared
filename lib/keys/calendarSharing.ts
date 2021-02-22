import { generateKeySalt } from 'pm-srp';
import { createMessage, decryptMessage, encryptMessage, generateSessionKey, OpenPGPKey } from 'pmcrypto';
import { AES256 } from '../constants';
import { hasBit } from '../helpers/bitset';
import { uint8ArrayToBase64String, uint8ArrayToString } from '../helpers/encoding';
import { getSHA256Base64String, getSHA256BinaryString, getSHA256String } from '../helpers/hash';
import { CalendarKey, CalendarKeyFlags, Passphrase } from '../interfaces/calendar';
import { decryptPassphrase } from './calendarKeys';

export const keyCharAt = (key: string, i: number) => key.charCodeAt(Math.floor(i % key.length));

export const xorEncrypt = (key: string, data: string) =>
    Uint8Array.from(data.split('').map((character, index) => character.charCodeAt(0) ^ keyCharAt(key, index)));

export const decryptPurpose = async ({
    encryptedPurpose,
    publicKeys,
}: {
    encryptedPurpose: string;
    publicKeys: OpenPGPKey[];
}) =>
    decryptMessage({
        message: createMessage(encryptedPurpose),
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

    const { Passphrase, Signature } = memberPassphrase;

    return decryptPassphrase({
        armoredPassphrase: Passphrase,
        armoredSignature: Signature,
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
export const generateCacheKeySalt = () => generateKeySalt();

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

export const buildLink = () => {
    //
};
