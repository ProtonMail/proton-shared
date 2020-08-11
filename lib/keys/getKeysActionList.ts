import { getSHA256Fingerprints, OpenPGPKey } from 'pmcrypto';
import { CachedKey, KeyAction } from '../interfaces';

export default async (keys: CachedKey[] = []): Promise<KeyAction[]> => {
    const promises = keys
        .filter((k): k is CachedKey & { privateKey: OpenPGPKey } => !!k.privateKey)
        .map(async ({ privateKey, Key: { ID, Primary, Flags } }) => {
            // Undefined for user keys
            if (Flags === undefined) {
                throw new Error('Flags not set');
            }
            return {
                primary: Primary,
                fingerprint: privateKey.getFingerprint(),
                sha256Fingerprints: await getSHA256Fingerprints(privateKey),
                flags: Flags,
                ID,
            };
        });
    return Promise.all(promises);
};
