import { encryptPrivateKey } from 'pmcrypto';
import { Address, Api, CachedKey, UserModel as tsUserModel } from '../interfaces';
import { MEMBER_PRIVATE } from '../constants';
import getActionableKeysList from './getActionableKeysList';
import getSignedKeyList from './getSignedKeyList';
import { activateKeyRoute } from '../api/keys';

export const getAddressesWithKeysToActivate = (user: tsUserModel, addresses: Address[]) => {
    // If signed in as subuser, or not a readable member
    if (!user || !addresses || user.OrganizationPrivateKey || user.Private !== MEMBER_PRIVATE.READABLE) {
        return [];
    }
    return addresses.filter(({ Keys = [] }) => {
        return Keys.some(({ Activation }) => !!Activation);
    });
};

interface Args {
    addressKeys: CachedKey[];
    keyPassword: string;
    api: Api;
}
export const activateMemberAddressKeys = async ({ addressKeys, keyPassword, api }: Args) => {
    if (!addressKeys.length) {
        return;
    }
    if (!keyPassword) {
        throw new Error('Password required to generate keys');
    }
    const primaryPrivateKey = addressKeys[0].privateKey;
    if (!primaryPrivateKey) {
        // Should never happen in the initialization case, since these keys are decrypted with the activation token.
        return;
    }
    const actionableAddressKeys = await getActionableKeysList(addressKeys);
    for (const addressKey of addressKeys) {
        const {
            Key: { ID: KeyID, Activation },
            privateKey,
        } = addressKey;
        if (!Activation || !privateKey) {
            // eslint-disable-next-line no-continue
            return;
        }
        const encryptedPrivateKey = await encryptPrivateKey(privateKey, keyPassword);
        const SignedKeyList = await getSignedKeyList(actionableAddressKeys, primaryPrivateKey);

        await api(activateKeyRoute({ ID: KeyID, PrivateKey: encryptedPrivateKey, SignedKeyList }));
    }
};
