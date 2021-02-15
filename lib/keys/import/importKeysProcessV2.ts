import { OpenPGPKey } from 'pmcrypto';
import { verifySelfAuditResult, KTInfoToLS } from 'key-transparency-web-client';

import { Address, Api, DecryptedKey, KeyTransparencyState } from '../../interfaces';
import { KeyImportData, OnKeyImportCallback } from './interface';
import { getActiveKeyObject, getActiveKeys, getPrimaryFlag } from '../getActiveKeys';
import { getInactiveKeys } from '../getInactiveKeys';
import { getFilteredImportRecords } from './helper';
import { generateAddressKeyTokens, reformatAddressKey } from '../addressKeys';
import { getSignedKeyList } from '../signedKeyList';
import { createAddressKeyRouteV2 } from '../../api/keys';
import { reactivateAddressKeysV2 } from '../reactivation/reactivateKeysProcessV2';

export interface ImportKeysProcessV2Arguments {
    api: Api;
    keyImportRecords: KeyImportData[];
    onImport: OnKeyImportCallback;
    keyPassword: string;
    address: Address;
    addressKeys: DecryptedKey[];
    userKey: OpenPGPKey;
    keyTransparencyState?: KeyTransparencyState;
}

const importKeysProcessV2 = async ({
    api,
    keyImportRecords,
    onImport,
    address,
    addressKeys,
    userKey,
    keyTransparencyState,
}: ImportKeysProcessV2Arguments) => {
    const activeKeys = await getActiveKeys(address.SignedKeyList, address.Keys, addressKeys);
    const inactiveKeys = await getInactiveKeys(address.Keys, activeKeys);

    const [keysToReactivate, keysToImport, existingKeys] = getFilteredImportRecords(
        keyImportRecords,
        activeKeys,
        inactiveKeys
    );

    existingKeys.forEach((keyImportRecord) => {
        onImport(keyImportRecord.id, new Error('Key already active'));
    });

    let mutableActiveKeys = activeKeys;

    let ktMessageObject: KTInfoToLS | undefined;
    for (const keyImportRecord of keysToImport) {
        try {
            const { privateKey } = keyImportRecord;

            const { token, encryptedToken, signature } = await generateAddressKeyTokens(userKey);

            const { privateKey: reformattedPrivateKey, privateKeyArmored } = await reformatAddressKey({
                email: address.Email,
                passphrase: token,
                privateKey,
            });

            const newActiveKey = await getActiveKeyObject(reformattedPrivateKey, {
                ID: 'tmp',
                primary: getPrimaryFlag(mutableActiveKeys),
            });
            const updatedActiveKeys = [...mutableActiveKeys, newActiveKey];
            const SignedKeyList = await getSignedKeyList(updatedActiveKeys);

            if (keyTransparencyState) {
                ktMessageObject = await verifySelfAuditResult(
                    address,
                    SignedKeyList,
                    keyTransparencyState.ktSelfAuditResult,
                    keyTransparencyState.lastSelfAudit,
                    keyTransparencyState.isRunning,
                    api
                );
            }

            const { Key } = await api(
                createAddressKeyRouteV2({
                    AddressID: address.ID,
                    Primary: newActiveKey.primary,
                    PrivateKey: privateKeyArmored,
                    SignedKeyList,
                    Signature: signature,
                    Token: encryptedToken,
                })
            );

            // Mutably update the key with the latest value from the real ID.
            newActiveKey.ID = Key.ID;

            mutableActiveKeys = updatedActiveKeys;

            onImport(keyImportRecord.id, 'ok');
        } catch (e) {
            onImport(keyImportRecord.id, e);
        }
    }

    let [, ktMessageObjectFromReactivate] = await reactivateAddressKeysV2({
        api,
        address,
        activeKeys: mutableActiveKeys,
        userKey,
        keysToReactivate,
        onReactivation: onImport,
    });

    if (!Object.getOwnPropertyNames(ktMessageObjectFromReactivate).includes('message')) {
        return ktMessageObject;
    }
    ktMessageObjectFromReactivate = ktMessageObjectFromReactivate as { message: string; addressID: string };
    return ktMessageObjectFromReactivate.message !== '' ? ktMessageObjectFromReactivate : ktMessageObject;
};

export default importKeysProcessV2;
