import {
    createCleartextMessage,
    decryptMessage,
    decryptSessionKey,
    getMessage,
    getSignature,
    OpenPGPKey,
    SessionKey,
    VERIFICATION_STATUS,
    verifyMessage,
} from 'pmcrypto';

import { base64StringToUint8Array } from '../helpers/encoding';
import { CalendarEventData } from '../interfaces/calendar';
import { SimpleMap } from '../interfaces/utils';
import { CALENDAR_CARD_TYPE } from './constants';

export const getDecryptedSessionKey = async (data: Uint8Array, privateKeys: OpenPGPKey | OpenPGPKey[]) => {
    return decryptSessionKey({ message: await getMessage(data), privateKeys });
};

export const verifySignedCard = async (
    dataToVerify: string,
    signature: string,
    publicKeys: OpenPGPKey | OpenPGPKey[]
) => {
    // we always expect a signed card
    const { verified } = await verifyMessage({
        message: await createCleartextMessage(dataToVerify),
        publicKeys,
        signature: await getSignature(signature),
        detached: true,
    });
    const hasPublicKeys = Array.isArray(publicKeys) ? !!publicKeys.length : !!publicKeys;
    const isVerified = hasPublicKeys ? verified === VERIFICATION_STATUS.SIGNED_AND_VALID : undefined;

    return { data: dataToVerify, isVerified };
};

export const decryptCard = async (
    dataToDecrypt: Uint8Array,
    signature: string | null,
    publicKeys: OpenPGPKey | OpenPGPKey[],
    sessionKey?: SessionKey
) => {
    // we always expect a signed card
    const { data: decryptedData, verified } = await decryptMessage({
        message: await getMessage(dataToDecrypt),
        publicKeys,
        signature: signature ? await getSignature(signature) : undefined,
        sessionKeys: sessionKey ? [sessionKey] : undefined,
    });
    const hasPublicKeys = Array.isArray(publicKeys) ? !!publicKeys.length : !!publicKeys;
    const isVerified = hasPublicKeys ? verified === VERIFICATION_STATUS.SIGNED_AND_VALID : undefined;

    if (typeof decryptedData !== 'string') {
        throw new Error('Unknown data');
    }

    return { data: decryptedData, isVerified };
};

export const decryptAndVerifyCalendarEvent = (
    { Type, Data, Signature, Author }: CalendarEventData,
    publicKeysMap: SimpleMap<OpenPGPKey | OpenPGPKey[]>,
    sessionKey: SessionKey | undefined
): Promise<{ data: string; isVerified?: boolean }> => {
    const publicKeys = publicKeysMap[Author] || [];
    if (Type === CALENDAR_CARD_TYPE.CLEAR_TEXT) {
        return Promise.resolve({ data: Data });
    }
    if (Type === CALENDAR_CARD_TYPE.ENCRYPTED) {
        return decryptCard(base64StringToUint8Array(Data), Signature, [], sessionKey);
    }
    if (Type === CALENDAR_CARD_TYPE.SIGNED) {
        if (!Signature) {
            throw new Error('Signed card is missing signature');
        }
        return verifySignedCard(Data, Signature, publicKeys);
    }
    if (Type === CALENDAR_CARD_TYPE.ENCRYPTED_AND_SIGNED) {
        if (!Signature) {
            throw new Error('Encrypted and signed card is missing signature');
        }
        return decryptCard(base64StringToUint8Array(Data), Signature, publicKeys, sessionKey);
    }
    throw new Error('Unknow event card type');
};
