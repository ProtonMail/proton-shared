import { key } from 'openpgp';
import { decryptMessage, getMessage, encryptMessage, generateKey } from 'pmcrypto';
import { openpgp } from 'pmcrypto/lib/openpgp';
import { ReadableStream as PolyfillReadableStream } from 'web-streams-polyfill';
import { createReadableStreamWrapper } from '@mattiasbuelens/web-streams-adapter';
import { ENCRYPTION_CONFIGS, ENCRYPTION_TYPES } from '../constants';
import { generatePassphrase } from './calendarKeys';

const toPolyfillReadable = createReadableStreamWrapper(PolyfillReadableStream);

interface UnsignedEncryptionPayload {
    message: string;
    privateKey: key.Key;
}

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

export const generateDriveBootstrap = async (addressPrivateKey: key.Key) => {
    const rawSharePassphrase = generatePassphrase();
    const rawFolderPassphrase = generatePassphrase();

    const [
        { privateKey: sharePrivateKey, privateKeyArmored: ShareKey },
        { privateKey: folderPrivateKey, privateKeyArmored: FolderKey },
        SharePassphrase
    ] = await Promise.all([
        generateDriveKey(rawSharePassphrase),
        generateDriveKey(rawFolderPassphrase),
        encryptUnsigned({ message: rawSharePassphrase, privateKey: addressPrivateKey })
    ]);

    const [FolderPassphrase, FolderName] = await Promise.all([
        await encryptUnsigned({
            message: rawFolderPassphrase,
            privateKey: sharePrivateKey
        }),
        await encryptUnsigned({
            message: 'root',
            privateKey: folderPrivateKey
        })
    ]);

    return {
        SharePassphrase,
        FolderPassphrase,
        ShareKey,
        FolderKey,
        FolderName
    };
};
