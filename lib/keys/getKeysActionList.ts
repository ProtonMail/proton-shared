import { CachedKey, KeyAction } from '../interfaces';

export default async (keys: CachedKey[] = []): Promise<KeyAction[]> => {
    return keys.map(({ privateKey, Key: { ID, Primary, Flags, Fingerprint } }) => {
        return {
            primary: Primary,
            fingerprint: privateKey ? privateKey.getFingerprint() : Fingerprint,
            flags: Flags,
            ID
        };
    });
};
