import { Address, Api, UserModel as tsUserModel } from '../interfaces';
import { ADDRESS_STATUS, DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS, MEMBER_PRIVATE } from '../constants';
import { generateAddressKey } from './keys';
import createAddressKeyHelper from './createAddressKeyHelper';

export const getAddressesWithKeysToGenerate = (user: tsUserModel, addresses: Address[]) => {
    // If signed in as subuser, or not a private user
    if (!user || !addresses || user.OrganizationPrivateKey || user.Private !== MEMBER_PRIVATE.UNREADABLE) {
        return [];
    }
    // Any enabled address without keys
    return addresses.filter(({ Status, Keys = [] }) => {
        return Status === ADDRESS_STATUS.STATUS_ENABLED && !Keys.length;
    });
};

interface Args {
    address: Address;
    keyPassword: string;
    api: Api;
}

export const generatePrivateMemberKeys = async ({ address, keyPassword, api }: Args) => {
    if (!keyPassword) {
        throw new Error('Password required to generate keys');
    }

    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email: address.Email,
        passphrase: keyPassword,
        encryptionConfig: ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
    });

    await createAddressKeyHelper({
        api,
        privateKeyArmored,
        privateKey,
        Address: address,
        parsedKeys: [],
        actionableKeys: [],
        signingKey: privateKey,
    });
};
