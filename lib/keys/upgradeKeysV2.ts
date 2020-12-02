import { computeKeyPassword, generateKeySalt } from 'pm-srp';

import {
    Address as tsAddress,
    Api,
    Key as tsKey,
    User as tsUser,
    OrganizationKey as tsOrganizationKey,
    CachedOrganizationKey,
    DecryptedKey,
} from '../interfaces';
import { getOrganizationKeys } from '../api/organization';
import { USER_ROLES } from '../constants';
import { srpVerify } from '../srp';
import { getOldUserIDEmailHelper } from './keys';
import { reformatAddressKey } from './addressKeys';
import { getDecryptedOrganizationKey } from './getDecryptedOrganizationKey';
import { reformatOrganizationKey } from './organizationKeys';
import { upgradeKeysRoute } from '../api/keys';
import { getDecryptedUserKeys } from './getDecryptedUserKeys';
import { getDecryptedAddressKeys } from './getDecryptedAddressKeys';
import isTruthy from '../helpers/isTruthy';
import { getPrimaryKey } from './getPrimaryKey';

export const getV2KeyToUpgrade = (Key: tsKey) => {
    return Key.Version < 3;
};

export const getV2KeysToUpgrade = (Keys?: tsKey[]) => {
    if (!Keys) {
        return [];
    }
    return Keys.filter(getV2KeyToUpgrade);
};

export const getHasV2KeysToUpgrade = (User: tsUser, Addresses: tsAddress[]) => {
    return (
        getV2KeysToUpgrade(User.Keys).length > 0 ||
        Addresses.some((Address) => getV2KeysToUpgrade(Address.Keys).length > 0)
    );
};

const getReformattedKeys = (keys: DecryptedKey[], email: string, passphrase: string) => {
    return Promise.all(
        keys.map(async ({ privateKey, ID }) => {
            if (!privateKey) {
                return;
            }
            const { privateKeyArmored } = await reformatAddressKey({
                email,
                passphrase,
                privateKey,
            });
            return {
                ID,
                PrivateKey: privateKeyArmored,
            };
        })
    );
};

const getReformattedUserKeys = async (userKeys: DecryptedKey[], newPassword: string) => {
    if (!userKeys || !userKeys.length) {
        return [];
    }
    const primaryPrivateKey = getPrimaryKey(userKeys)?.privateKey;
    if (!primaryPrivateKey) {
        return [];
    }
    const emailToUse = getOldUserIDEmailHelper(primaryPrivateKey);
    return getReformattedKeys(userKeys, emailToUse, newPassword);
};

interface UpgradeKeysArgs {
    user: tsUser;
    loginPassword: string;
    clearKeyPassword: string;
    api: Api;
    isOnePasswordMode?: boolean;
    userKeys: DecryptedKey[];
    organizationKey?: CachedOrganizationKey;
    addressesKeys: {
        address: tsAddress;
        keys: DecryptedKey[];
    }[];
}

export const upgradeV2Keys = async ({
    user,
    userKeys,
    addressesKeys,
    organizationKey,
    loginPassword,
    clearKeyPassword,
    isOnePasswordMode,
    api,
}: UpgradeKeysArgs) => {
    if (!clearKeyPassword || !loginPassword) {
        throw new Error('Password required');
    }
    // Not allowed signed into member
    if (user.OrganizationPrivateKey) {
        return;
    }

    const hasDecryptedUserKeysToUpgrade = userKeys.some(({ privateKey, ID }) => {
        const Key = user.Keys.find(({ ID: KeyID }) => KeyID === ID);
        return Key && privateKey && getV2KeyToUpgrade(Key);
    });
    const hasDecryptedAddressKeyToUpgrade = addressesKeys.some(({ address, keys }) => {
        return keys.some(({ privateKey, ID }) => {
            const Key = address.Keys.find(({ ID: KeyID }) => KeyID === ID);
            return Key && privateKey && getV2KeyToUpgrade(Key);
        });
    });

    if (!hasDecryptedUserKeysToUpgrade && !hasDecryptedAddressKeyToUpgrade) {
        return;
    }

    const keySalt = generateKeySalt();
    const newKeyPassword: string = await computeKeyPassword(clearKeyPassword, keySalt);

    const [reformattedUserKeys, reformattedAddressesKeys, reformattedOrganizationKey] = await Promise.all([
        getReformattedUserKeys(userKeys, newKeyPassword),
        Promise.all(
            addressesKeys.map(async ({ address, keys }) => {
                return getReformattedKeys(keys, address.Email, newKeyPassword);
            })
        ),
        organizationKey?.privateKey ? reformatOrganizationKey(organizationKey.privateKey, newKeyPassword) : undefined,
    ]);

    const reformattedKeys = [
        ...reformattedUserKeys.filter(isTruthy),
        ...reformattedAddressesKeys.flat().filter(isTruthy),
    ];

    const config = upgradeKeysRoute({
        KeySalt: keySalt,
        Keys: reformattedKeys,
        OrganizationKey: reformattedOrganizationKey?.privateKeyArmored,
    });

    if (isOnePasswordMode) {
        await srpVerify({
            api,
            credentials: { password: loginPassword },
            config,
        });
        return newKeyPassword;
    }

    await api(config);

    return newKeyPassword;
};

interface Args {
    addresses: tsAddress[];
    user: tsUser;
    loginPassword: string;
    clearKeyPassword: string;
    keyPassword: string;
    api: Api;
    isOnePasswordMode?: boolean;
}

export const upgradeV2KeysHelper = async ({
    user,
    addresses,
    loginPassword,
    clearKeyPassword,
    keyPassword,
    isOnePasswordMode,
    api,
}: Args) => {
    const userKeys = await getDecryptedUserKeys({ user, userKeys: user.Keys, keyPassword });

    const addressesKeys = await Promise.all(
        addresses.map(async (address) => {
            return {
                address,
                keys: await getDecryptedAddressKeys({
                    user,
                    userKeys,
                    address,
                    addressKeys: address.Keys,
                    keyPassword,
                }),
            };
        })
    );

    const organizationKey =
        user.Role === USER_ROLES.ADMIN_ROLE
            ? await api<tsOrganizationKey>(getOrganizationKeys()).then((Key) => {
                  return getDecryptedOrganizationKey({ keyPassword, Key });
              })
            : undefined;

    return upgradeV2Keys({
        user,
        userKeys,
        addressesKeys,
        organizationKey,
        loginPassword,
        clearKeyPassword,
        isOnePasswordMode,
        api,
    });
};
