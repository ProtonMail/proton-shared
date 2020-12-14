import { getSHA256Fingerprints, OpenPGPKey } from 'pmcrypto';
import { ActiveKey, DecryptedKey, Key, SignedKeyList } from '../interfaces';
import { getParsedSignedKeyList, getSignedKeyListMap } from './signedKeyList';
import isTruthy from '../helpers/isTruthy';
import { getDefaultKeyFlags } from './keyFlags';

export const getPrimaryFlag = (keys: ActiveKey[]): 1 | 0 => {
    return !keys.length ? 1 : 0;
};

export const getActiveKeyObject = async (
    privateKey: OpenPGPKey,
    partial: Partial<ActiveKey> & { ID: string }
): Promise<ActiveKey> => {
    return {
        privateKey,
        publicKey: privateKey.toPublic(),
        flags: getDefaultKeyFlags(),
        primary: 0,
        fingerprint: privateKey.getFingerprint(),
        sha256Fingerprints: await getSHA256Fingerprints(privateKey),
        ...partial,
    };
};

export const getActiveKeys = async (
    signedKeyList: SignedKeyList | null | undefined,
    keys: Key[],
    decryptedKeys: DecryptedKey[]
): Promise<ActiveKey[]> => {
    if (!decryptedKeys.length) {
        return [];
    }

    const signedKeyListMap = getSignedKeyListMap(getParsedSignedKeyList(signedKeyList?.Data));

    const result = await Promise.all(
        decryptedKeys.map(async ({ ID, privateKey }, index) => {
            const fingerprint = privateKey.getFingerprint();
            const signedKeyListItem = signedKeyListMap[fingerprint];
            return getActiveKeyObject(privateKey, {
                ID,
                primary: signedKeyListItem?.Primary ?? index === 0 ? 1 : 0,
                // Need to use Flags from the key object for the case of reactivating keys.
                flags: signedKeyListItem?.Flags ?? getDefaultKeyFlags(),
            });
        })
    );

    return result.filter(isTruthy);
};
