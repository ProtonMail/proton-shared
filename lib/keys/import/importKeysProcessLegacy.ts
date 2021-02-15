import { verifySelfAuditResult, KTInfoToLS } from 'key-transparency-web-client';
import { KeyImportData, OnKeyImportCallback } from './interface';
import { Address, Api, DecryptedKey, KeyTransparencyState } from '../../interfaces';
import { reformatAddressKey } from '../addressKeys';
import { getSignedKeyList } from '../signedKeyList';
import reactivateKeysProcessLegacy from '../reactivation/reactivateKeysProcessLegacy';
import { createAddressKeyRoute } from '../../api/keys';
import { getInactiveKeys } from '../getInactiveKeys';
import { getActiveKeyObject, getActiveKeys, getPrimaryFlag } from '../getActiveKeys';
import { getFilteredImportRecords } from './helper';

export interface ImportKeysProcessLegacyArguments {
    api: Api;
    keyImportRecords: KeyImportData[];
    onImport: OnKeyImportCallback;
    keyPassword: string;
    address: Address;
    addressKeys: DecryptedKey[];
    keyTransparencyState?: KeyTransparencyState;
}

const importKeysProcessLegacy = async ({
    api,
    keyImportRecords,
    keyPassword,
    onImport,
    address,
    addressKeys,
    keyTransparencyState,
}: ImportKeysProcessLegacyArguments) => {
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

            const { privateKey: reformattedPrivateKey, privateKeyArmored } = await reformatAddressKey({
                email: address.Email,
                passphrase: keyPassword,
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
                createAddressKeyRoute({
                    AddressID: address.ID,
                    Primary: newActiveKey.primary,
                    PrivateKey: privateKeyArmored,
                    SignedKeyList,
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

    const [ktMessageObjectFromReactivate] = await reactivateKeysProcessLegacy({
        api,
        keyPassword,
        keyReactivationRecords: [
            {
                address,
                keys: mutableActiveKeys,
                keysToReactivate,
            },
        ],
        onReactivation: onImport,
    });

    return !ktMessageObjectFromReactivate ? ktMessageObject : ktMessageObjectFromReactivate;
};

export default importKeysProcessLegacy;
