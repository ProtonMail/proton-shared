import { computeKeyPassword, generateKeySalt } from 'pm-srp';

import {
    Address as tsAddress,
    Api,
    CachedKey,
    Key as tsKey,
    User as tsUser,
    OrganizationKey as tsOrganizationKey,
    CachedOrganizationKey,
} from '../interfaces';
import { getOldUserIDEmailHelper, reformatAddressKey } from './keys';
import { srpVerify } from '../srp';
import { upgradeKeysRoute } from '../api/keys';
import { getDecryptedUserKeys } from './getDecryptedUserKeys';
import { getDecryptedAddressKeys } from './getDecryptedAddressKeys';
import isTruthy from '../helpers/isTruthy';
import { getOrganizationKeys } from '../api/organization';
import { USER_ROLES } from '../constants';
import { getDecryptedOrganizationKey } from './getDecryptedOrganizationKey';
import { reformatOrganizationKey } from './organizationKeys';

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

const getReformattedKeys = (keys: CachedKey[], email: string, passphrase: string) => {
    return Promise.all(
        keys.map(async ({ privateKey, Key }) => {
            if (!privateKey) {
                return;
            }
            const { privateKeyArmored } = await reformatAddressKey({
                email,
                passphrase,
                privateKey,
            });
            return {
                ID: Key.ID,
                PrivateKey: privateKeyArmored,
            };
        })
    );
};

const getReformattedUserKeys = async (userKeys: CachedKey[], newPassword: string) => {
    if (!userKeys || !userKeys.length) {
        return [];
    }
    const primaryKey = userKeys[0].privateKey;
    if (!primaryKey) {
        return [];
    }
    const emailToUse = getOldUserIDEmailHelper(primaryKey);
    return getReformattedKeys(userKeys, emailToUse, newPassword);
};

interface UpgradeKeysArgs {
    User: tsUser;
    loginPassword: string;
    clearKeyPassword: string;
    api: Api;
    isOnePasswordMode?: boolean;
    userKeys: CachedKey[];
    organizationKey?: CachedOrganizationKey;
    addressesKeys: {
        Address: tsAddress;
        keys: CachedKey[];
    }[];
}

export const upgradeV2Keys = async ({
    User,
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
    if (User.OrganizationPrivateKey) {
        return;
    }

    const hasDecryptedUserKeysToUpgrade = userKeys.some(({ privateKey, Key }) => {
        return privateKey && getV2KeyToUpgrade(Key);
    });
    const hasDecryptedAddressKeyToUpgrade = addressesKeys.some(({ keys }) => {
        return keys.some(({ privateKey, Key }) => {
            return privateKey && getV2KeyToUpgrade(Key);
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
            addressesKeys.map(async ({ Address, keys }) => {
                return getReformattedKeys(keys, Address.Email, newKeyPassword);
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
    Addresses: tsAddress[];
    User: tsUser;
    loginPassword: string;
    clearKeyPassword: string;
    keyPassword: string;
    api: Api;
    isOnePasswordMode?: boolean;
}

export const upgradeV2KeysHelper = async ({
    User,
    Addresses,
    loginPassword,
    clearKeyPassword,
    keyPassword,
    isOnePasswordMode,
    api,
}: Args) => {
    const userKeys = await getDecryptedUserKeys({ userKeys: User.Keys, keyPassword });

    const addressesKeys = await Promise.all(
        Addresses.map(async (Address) => {
            return {
                Address,
                keys: await getDecryptedAddressKeys({
                    userKeys,
                    addressKeys: Address.Keys,
                    keyPassword,
                }),
            };
        })
    );

    const organizationKey =
        User.Role === USER_ROLES.ADMIN_ROLE
            ? await api<tsOrganizationKey>(getOrganizationKeys()).then((Key) => {
                  return getDecryptedOrganizationKey({ keyPassword, Key });
              })
            : undefined;

    return upgradeV2Keys({
        User,
        userKeys,
        addressesKeys,
        organizationKey,
        loginPassword,
        clearKeyPassword,
        isOnePasswordMode,
        api,
    });
};
