import { getHasMigratedAddressKeys } from '../keyMigration';
import importKeysProcessLegacy, { ImportKeysProcessLegacyArguments } from './importKeysProcessLegacy';
import importKeysProcessV2, { ImportKeysProcessV2Arguments } from './importKeysProcessV2';
import { Address, DecryptedKey, KeyTransparencyVerifier } from '../../interfaces';
import { getPrimaryKey } from '../getPrimaryKey';

interface Arguments extends Omit<ImportKeysProcessV2Arguments, 'userKey'>, ImportKeysProcessLegacyArguments {
    addresses: Address[];
    userKeys: DecryptedKey[];
    keyTransparencyVerifier?: KeyTransparencyVerifier;
}

export const importKeysProcess = async ({
    api,
    userKeys,
    address,
    addressKeys,
    addresses,
    keyImportRecords,
    keyPassword,
    onImport,
    keyTransparencyVerifier,
}: Arguments) => {
    const hasMigratedAddressKeys = getHasMigratedAddressKeys(addresses);

    if (hasMigratedAddressKeys) {
        const primaryPrivateUserKey = getPrimaryKey(userKeys)?.privateKey;
        if (!primaryPrivateUserKey) {
            throw new Error('Missing primary private user key');
        }
        return importKeysProcessV2({
            api,
            keyImportRecords,
            keyPassword,
            address,
            addressKeys,
            onImport,
            userKey: primaryPrivateUserKey,
            keyTransparencyVerifier,
        });
    }

    return importKeysProcessLegacy({
        api,
        keyImportRecords,
        keyPassword,
        address,
        addressKeys,
        onImport,
        keyTransparencyVerifier,
    });
};
