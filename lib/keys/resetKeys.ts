import { generateAddressKey } from './keys';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '../constants';
import getSignedKeyList from './getSignedKeyList';
import { Address, EncryptionConfig } from '../interfaces';
import { getKeyFlagsAddress } from './keyFlags';

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
        addresses.map(async (address, i) => {
            const { privateKey, privateKeyArmored } = newAddressesKeys[i];
            const { ID: AddressID, Keys = [] } = address;

            const newPrimary = {
                privateKey,
                primary: 1,
                flags: getKeyFlagsAddress(address, Keys),
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
