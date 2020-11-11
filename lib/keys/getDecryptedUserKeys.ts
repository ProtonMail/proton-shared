import { decryptPrivateKey } from 'pmcrypto';

import { noop } from '../helpers/function';
import { CachedKey, Key as tsKey } from '../interfaces';
import { decryptMemberToken } from './memberToken';

interface Args {
    userKeys: tsKey[];
    OrganizationPrivateKey?: string;
    keyPassword: string;
}

export const getDecryptedUserKeys = async ({
    userKeys,
    OrganizationPrivateKey,
    keyPassword,
}: Args): Promise<CachedKey[]> => {
    if (userKeys.length === 0) {
        return [];
    }

    const organizationKey = OrganizationPrivateKey
        ? await decryptPrivateKey(OrganizationPrivateKey, keyPassword).catch(noop)
        : undefined;

    const getKeyPasssword = ({ Token }: tsKey) => {
        if (Token && organizationKey) {
            return decryptMemberToken(Token, organizationKey);
        }
        return keyPassword;
    };

    const process = async (Key: tsKey) => {
        try {
            const { PrivateKey } = Key;
            const keyPassword = await getKeyPasssword(Key);
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

    const [primaryKey, ...restKeys] = userKeys;
    const primaryKeyResult = await process(primaryKey);

    // In case the primary key fails to decrypt, something is broken, so don't even try to decrypt the rest of the keys.
    if (primaryKeyResult.error) {
        return [primaryKeyResult, ...restKeys.map((Key) => ({ Key, error: primaryKeyResult.error }))];
    }
    const restKeysResult = await Promise.all(restKeys.map(process));
    return [primaryKeyResult, ...restKeysResult];
};
