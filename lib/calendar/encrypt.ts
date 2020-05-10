import {
    encryptMessage,
    signMessage,
    splitMessage,
    getPreferredAlgorithm,
    generateSessionKey,
    encryptSessionKey,
    SessionKey,
    OpenPGPKey
} from 'pmcrypto';

import { CALENDAR_CARD_TYPE } from './constants';

export const signCard = async (dataToSign: string, signingKey: OpenPGPKey) => {
    if (!dataToSign) {
        return;
    }
    const { signature } = await signMessage({
        data: dataToSign,
        privateKeys: [signingKey],
        armor: false,
        detached: true
    });
    return {
        data: dataToSign,
        signature
    };
};

export const encryptCard = async (dataToEncrypt: string, signingKey: OpenPGPKey, sessionKey: SessionKey) => {
    if (!dataToEncrypt) {
        return;
    }
    const { message, signature } = await encryptMessage({
        data: dataToEncrypt,
        privateKeys: [signingKey],
        sessionKey,
        armor: false,
        detached: true
    });
    const { encrypted } = await splitMessage(message);
    return {
        dataPacket: encrypted[0],
        signature
    };
};

export const getEncryptedSessionKey = async ({ data, algorithm }: SessionKey, publicKey: OpenPGPKey) => {
    const { message } = await encryptSessionKey({ data, algorithm, publicKeys: [publicKey] });
    const { asymmetric } = await splitMessage(message);
    return asymmetric[0];
};

export const createSessionKey = async (publicKey: OpenPGPKey) => {
    const algorithm = await getPreferredAlgorithm([publicKey]);
    const sessionKey = await generateSessionKey(algorithm);
    return {
        data: sessionKey,
        algorithm
    };
};

interface PartToEncrypt {
    [CALENDAR_CARD_TYPE.SIGNED]: string;
    [CALENDAR_CARD_TYPE.ENCRYPTED_AND_SIGNED]: string;
}
export const encryptAndSignPart = (
    { [CALENDAR_CARD_TYPE.SIGNED]: toSign, [CALENDAR_CARD_TYPE.ENCRYPTED_AND_SIGNED]: toEncryptAndSign }: PartToEncrypt,
    signingKey: OpenPGPKey,
    sessionKey: SessionKey
) => {
    return Promise.all([signCard(toSign, signingKey), encryptCard(toEncryptAndSign, signingKey, sessionKey)]);
};
