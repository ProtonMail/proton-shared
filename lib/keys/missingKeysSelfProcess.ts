import { Api, Address, EncryptionConfig, DecryptedKey, KeyTransparencyVerifier } from '../interfaces';
import { getHasMigratedAddressKeys } from './keyMigration';
import { getPrimaryKey } from './getPrimaryKey';
import { createAddressKeyLegacy, createAddressKeyV2 } from './add';

type OnUpdateCallback = (ID: string, update: { status: 'loading' | 'error' | 'ok'; result?: string }) => void;

interface MissingKeysSelfProcessArguments {
    api: Api;
    userKeys: DecryptedKey[];
    encryptionConfig: EncryptionConfig;
    addresses: Address[];
    addressesToGenerate: Address[];
    password: string;
    onUpdate: OnUpdateCallback;
    keyTransparencyVerifier?: KeyTransparencyVerifier;
}

export const missingKeysSelfProcess = ({
    api,
    userKeys,
    encryptionConfig,
    addresses,
    addressesToGenerate,
    password,
    onUpdate,
    keyTransparencyVerifier,
}: MissingKeysSelfProcessArguments) => {
    const hasMigratedAddressKeys = getHasMigratedAddressKeys(addresses);
    const primaryUserKey = getPrimaryKey(userKeys)?.privateKey;
    if (!primaryUserKey) {
        throw new Error('Missing primary user key');
    }

    return Promise.all(
        addressesToGenerate.map(async (address) => {
            try {
                onUpdate(address.ID, { status: 'loading' });

                if (hasMigratedAddressKeys) {
                    await createAddressKeyV2({
                        api,
                        address,
                        encryptionConfig,
                        userKey: primaryUserKey,
                        activeKeys: [],
                        keyTransparencyVerifier,
                    });
                } else {
                    await createAddressKeyLegacy({
                        api,
                        address,
                        encryptionConfig,
                        passphrase: password,
                        activeKeys: [],
                        keyTransparencyVerifier,
                    });
                }

                onUpdate(address.ID, { status: 'ok' });
            } catch (e) {
                onUpdate(address.ID, { status: 'error', result: e.message });
            }
        })
    );
};
