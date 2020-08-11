import { getSHA256Fingerprints } from 'pmcrypto';
import { generateAddressKey } from './keys';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS, KEY_FLAG } from '../constants';
import getSignedKeyList from './getSignedKeyList';
import { Address, EncryptionConfig } from '../interfaces';

/**
 * Generates a new key for each address, encrypted with the new passphrase.
 */
export const getResetAddressesKeys = async ({
    addresses = [],
    passphrase = '',
    encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
}: {
    addresses: Address[];
    passphrase: string;
    encryptionConfig?: EncryptionConfig;
}) => {
    const newAddressesKeys = await Promise.all(
        addresses.map(({ Email }) => {
            return generateAddressKey({ email: Email, passphrase, encryptionConfig });
        })
    );
    return Promise.all(
        addresses.map(async ({ ID: AddressID, Keys = [], Receive }, i) => {
            const { privateKey, privateKeyArmored } = newAddressesKeys[i];

            const newPrimary = {
                fingerprint: privateKey.getFingerprint(),
                sha256Fingerprints: await getSHA256Fingerprints(privateKey),
                primary: 1,
                // If there were keys, and the address can not receive, the new key can also not receive
                flags: Keys.length && Receive === 0 ? KEY_FLAG.VERIFY : KEY_FLAG.ENCRYPT + KEY_FLAG.VERIFY,
            };

            const signedKeyList = await getSignedKeyList([newPrimary], privateKey);
            return {
                AddressID,
                PrivateKey: privateKeyArmored,
                SignedKeyList: signedKeyList,
            };
        })
    );
};
