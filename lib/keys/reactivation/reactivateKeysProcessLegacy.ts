import { Address, Api, DecryptedKey, Key, KeyTransparencyVerifier } from '../../interfaces';
import { reactivateKeyRoute } from '../../api/keys';
import { getSignedKeyList } from '../signedKeyList';
import { KeyReactivationData, KeyReactivationRecord, OnKeyReactivationCallback } from './interface';
import { getActiveKeyObject, getActiveKeys, getPrimaryFlag } from '../getActiveKeys';
import { reformatAddressKey } from '../addressKeys';
import { USER_KEY_USERID } from '../userKeys';

interface ReactivateKeysProcessArguments {
    api: Api;
    keyPassword: string;
    keysToReactivate: KeyReactivationData[];
    address?: Address;
    onReactivation: OnKeyReactivationCallback;
    keys: DecryptedKey[];
    Keys: Key[];
    keyTransparencyVerifier?: KeyTransparencyVerifier;
}

export const reactivateKeysProcess = async ({
    api,
    keyPassword,
    keysToReactivate,
    address,
    onReactivation,
    keys,
    Keys,
    keyTransparencyVerifier,
}: ReactivateKeysProcessArguments) => {
    const activeKeys = await getActiveKeys(address?.SignedKeyList, Keys, keys);

    let mutableActiveKeys = activeKeys;

    for (const keyToReactivate of keysToReactivate) {
        const { id, Key, privateKey: decryptedPrivateKey } = keyToReactivate;
        const { ID } = Key;
        try {
            if (!decryptedPrivateKey) {
                throw new Error('Missing private key');
            }
            const email = address ? address.Email : USER_KEY_USERID;

            const { privateKey: reformattedPrivateKey, privateKeyArmored } = await reformatAddressKey({
                email,
                passphrase: keyPassword,
                privateKey: decryptedPrivateKey,
            });

            const newActiveKey = await getActiveKeyObject(reformattedPrivateKey, {
                ID,
                primary: getPrimaryFlag(mutableActiveKeys),
            });
            const updatedActiveKeys = [...mutableActiveKeys, newActiveKey];
            const SignedKeyList = address ? await getSignedKeyList(updatedActiveKeys) : undefined;

            if (address && SignedKeyList) {
                await keyTransparencyVerifier?.({ address, signedKeyList: SignedKeyList });
            }

            await api(
                reactivateKeyRoute({
                    ID,
                    PrivateKey: privateKeyArmored,
                    SignedKeyList,
                })
            );

            mutableActiveKeys = updatedActiveKeys;

            onReactivation(id, 'ok');
        } catch (e) {
            onReactivation(id, e);
        }
    }
};

export interface ReactivateKeysProcessLegacyArguments {
    api: Api;
    keyReactivationRecords: KeyReactivationRecord[];
    onReactivation: OnKeyReactivationCallback;
    keyPassword: string;
    keyTransparencyVerifier?: KeyTransparencyVerifier;
}

const reactivateKeysProcessLegacy = async ({
    keyReactivationRecords,
    api,
    onReactivation,
    keyPassword,
    keyTransparencyVerifier,
}: ReactivateKeysProcessLegacyArguments) => {
    for (const keyReactivationRecord of keyReactivationRecords) {
        const { user, address, keysToReactivate, keys } = keyReactivationRecord;
        try {
            const Keys = address ? address.Keys : user?.Keys || [];
            await reactivateKeysProcess({
                api,
                keyPassword,
                keysToReactivate,
                address,
                onReactivation,
                keys,
                Keys,
                keyTransparencyVerifier,
            });
        } catch (e) {
            keysToReactivate.forEach(({ id }) => onReactivation(id, e));
        }
    }
};

export default reactivateKeysProcessLegacy;
