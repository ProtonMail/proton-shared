import { getKeys } from 'pmcrypto';
import { DecryptedKey, Key } from '../interfaces';

export const getInactiveKeys = async (Keys: Key[], decryptedKeys: DecryptedKey[]) => {
    const keyPairsMap = new Set<string>(decryptedKeys.map(({ ID }) => ID));
    const inactiveKeys = Keys.filter(({ ID }) => !keyPairsMap.has(ID));
    return Promise.all(
        inactiveKeys.map(async (Key) => {
            const [privateKey] = await getKeys(Key.PrivateKey).catch(() => []);
            return {
                Key,
                privateKey,
                publicKey: privateKey?.toPublic(),
                fingerprint: privateKey?.getFingerprint(),
            };
        })
    );
};
