import { key } from 'openpgp';
import {
    decryptMessage,
    getMessage,
    encryptMessage,
    generateKey,
    binaryStringToArray,
    signMessage,
    arrayToHexString
} from 'pmcrypto';
import { openpgp } from 'pmcrypto/lib/openpgp';
import { ReadableStream as PolyfillReadableStream } from 'web-streams-polyfill';
import { createReadableStreamWrapper } from '@mattiasbuelens/web-streams-adapter';
import { ENCRYPTION_CONFIGS, ENCRYPTION_TYPES } from '../constants';
import { generatePassphrase } from './calendarKeys';
import { createSessionKey, getEncryptedSessionKey } from '../calendar/encrypt';
import { serializeUint8Array } from '../helpers/serialization';

const toPolyfillReadable = createReadableStreamWrapper(PolyfillReadableStream);

interface UnsignedEncryptionPayload {
    message: string;
    privateKey: key.Key;
}

export const sign = async (data: string, privateKeys: key.Key | key.Key[]) => {
    const { signature } = await signMessage({
        data,
        privateKeys,
        armor: true,
        detached: true
    });
    return signature;
};

export const encryptUnsigned = async ({ message, privateKey }: UnsignedEncryptionPayload) => {
    const { data: encryptedToken } = await encryptMessage({
        data: message,
        privateKeys: privateKey,
        publicKeys: privateKey.toPublic()
    });
    return encryptedToken as string;
};

export const getStreamMessage = (stream: ReadableStream<Uint8Array>) => {
    return openpgp.message.read(toPolyfillReadable(stream));
};

interface UnsignedDecryptionPayload {
    armoredMessage: string | Uint8Array;
    privateKey: key.Key;
}

/**
 * Decrypts unsigned armored message, in the context of drive it's share's passphrase and folder's contents.
 */
export const decryptUnsigned = async ({ armoredMessage, privateKey }: UnsignedDecryptionPayload) => {
    const { data: decryptedMessage } = await decryptMessage({
        message: await getMessage(armoredMessage),
        privateKeys: privateKey,
        publicKeys: privateKey.toPublic()
    });

    return decryptedMessage as string;
};

export const generateDriveKey = async (rawPassphrase: string) => {
    const encryptionConfigs = ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.X25519];
    const { key: privateKey, privateKeyArmored } = await generateKey({
        userIds: [{ name: 'Drive key' }],
        passphrase: rawPassphrase,
        ...encryptionConfigs
    });

    await privateKey.decrypt(rawPassphrase);

    return { privateKey, privateKeyArmored };
};

export const generateLookupHash = async (name: string, hashKey: string) => {
    const key = await crypto.subtle.importKey(
        'raw',
        binaryStringToArray(hashKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );

    const signature = await crypto.subtle.sign(
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        key,
        binaryStringToArray(name)
    );
    return arrayToHexString(new Uint8Array(signature));
};

export const generateNodeHashKey = async (privateKey: key.Key) => {
    const message = generatePassphrase();

    const NodeHashKey = await encryptUnsigned({
        message,
        privateKey
    });

    return { NodeHashKey };
};

export const generateNodeKeys = async (parentKey: key.Key) => {
    const rawPassphrase = generatePassphrase();
    const { privateKey, privateKeyArmored: NodeKey } = await generateDriveKey(rawPassphrase);

    const NodePassphrase = await encryptUnsigned({
        message: rawPassphrase,
        privateKey: parentKey
    });

    return { privateKey, NodeKey, NodePassphrase, rawPassphrase };
};

export const generateContentHash = async (content: Uint8Array) => {
    const data = await openpgp.crypto.hash.sha256(content);
    return { HashType: 'sha256', BlockHash: arrayToHexString(data) as string };
};

export const generateContentKeys = async (nodeKey: key.Key) => {
    const publicKey = nodeKey.toPublic();
    const sessionKey = await createSessionKey(publicKey);
    const contentKeys = await getEncryptedSessionKey(sessionKey, publicKey);
    const ContentKeyPacket = serializeUint8Array(contentKeys);
    return { sessionKey, ContentKeyPacket };
};

export const generateDriveBootstrap = async (addressPrivateKey: key.Key) => {
    const { NodeKey: ShareKey, NodePassphrase: SharePassphrase, privateKey: sharePrivateKey } = await generateNodeKeys(
        addressPrivateKey
    );

    const {
        NodeKey: FolderKey,
        NodePassphrase: FolderPassphrase,
        privateKey: folderPrivateKey
    } = await generateNodeKeys(sharePrivateKey);

    const FolderName = await encryptUnsigned({
        message: 'root',
        privateKey: folderPrivateKey
    });

    return {
        bootstrap: {
            SharePassphrase,
            FolderPassphrase,
            ShareKey,
            FolderKey,
            FolderName
        },
        sharePrivateKey
    };
};
