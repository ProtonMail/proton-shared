import { decryptPrivateKey } from 'pmcrypto';

import { CachedKey, Key as tsKey } from '../interfaces';
import { decryptMemberToken } from './memberToken';
import { getAddressKeyToken, splitKeys } from './keys';

interface Args {
    addressKeys: tsKey[];
    userKeys: CachedKey[];
    OrganizationPrivateKey?: string;
    isReadableMember?: boolean;
    keyPassword: string;
}

export const getDecryptedAddressKeys = async ({
    addressKeys,
    userKeys,
    isReadableMember,
    OrganizationPrivateKey,
    keyPassword,
}: Args): Promise<CachedKey[]> => {
    if (!addressKeys.length || !userKeys.length) {
        return [];
    }

    const organizationKey = OrganizationPrivateKey
        ? await decryptPrivateKey(OrganizationPrivateKey, keyPassword).catch(() => undefined)
        : undefined;

    const { privateKeys, publicKeys } = splitKeys(userKeys);

    const primaryUserKey = privateKeys[0];

    const getKeyPassword = ({ Activation, Token, Signature }: tsKey) => {
        if (!OrganizationPrivateKey && isReadableMember && primaryUserKey) {
            // Since the activation process is asynchronous, allow the private key to get decrypted already here so that it can be used
            if (Activation) {
                return decryptMemberToken(Activation, primaryUserKey);
            }
        }
        if (Token) {
            return getAddressKeyToken({ Token, Signature, organizationKey, privateKeys, publicKeys });
        }
        return keyPassword;
    };

    const process = async (Key: tsKey) => {
        try {
            const { PrivateKey } = Key;

            const keyPassword = await getKeyPassword(Key);
            const privateKey = await decryptPrivateKey(PrivateKey, keyPassword);
            return {
                Key,
                privateKey,
                publicKey: privateKey.toPublic(),
            };
        } catch (e) {
            return {
                Key,
                error: e,
            };
        }
    };

    const [primaryKey, ...restKeys] = addressKeys;

    const primaryKeyResult = await process(primaryKey);
    // In case the primary key fails to decrypt, something is broken, so don't even try to decrypt the rest of the keys.
    if (primaryKeyResult.error) {
        return [primaryKeyResult, ...restKeys.map((Key) => ({ Key, error: primaryKeyResult.error }))];
    }
    const restKeysResult = await Promise.all(restKeys.map(process));
    return [primaryKeyResult, ...restKeysResult];
};
