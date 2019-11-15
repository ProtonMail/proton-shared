import { decryptMessage, getMessage } from 'pmcrypto/lib/pmcrypto';
import { key } from 'openpgp';

interface UnsignedDecryptionPayload {
    armoredMessage: string;
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
