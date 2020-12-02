import { User as tsUser, Address as tsAddress, KeyPair, SignedKeyList, DecryptedKey } from '../../interfaces';

import { unique } from '../../helpers/array';

// import { getDefaultKeyFlags } from '../keyFlags';
import { getDecryptedAddressKeys } from '../getDecryptedAddressKeys';
import { getSignedKeyList } from '../signedKeyList';
import { getActiveKeys } from '../getActiveKeys';

interface GetReactivatedAddressKeys {
    address: tsAddress;
    oldUserKeys: KeyPair[];
    newUserKeys: KeyPair[];
    user: tsUser;
    keyPassword: string;
}

type GetReactivateAddressKeysReturnValue =
    | {
          address: tsAddress;
          reactivatedKeys?: undefined;
          signedKeyList?: undefined;
      }
    | {
          address: tsAddress;
          reactivatedKeys: DecryptedKey[];
          signedKeyList: SignedKeyList;
      };

export const getReactivatedAddressKeys = async ({
    address,
    user,
    oldUserKeys,
    newUserKeys,
    keyPassword,
}: GetReactivatedAddressKeys): Promise<GetReactivateAddressKeysReturnValue> => {
    const empty = {
        address,
        reactivatedKeys: undefined,
        signedKeyList: undefined,
    } as const;
    const sharedArgs = {
        user,
        address,
        addressKeys: address.Keys,
        keyPassword,
    };

    const oldAddressKeys = await getDecryptedAddressKeys({
        ...sharedArgs,
        userKeys: oldUserKeys,
    });

    // All keys were able to decrypt previously, can just return.
    if (oldAddressKeys.length === address.Keys.length) {
        return empty;
    }
    const newAddressKeys = await getDecryptedAddressKeys({
        ...sharedArgs,
        userKeys: newUserKeys,
    });

    // No difference in how many keys were able to get decrypted
    if (oldAddressKeys.length === newAddressKeys.length) {
        return empty;
    }
    if (newAddressKeys.length < oldAddressKeys.length) {
        throw new Error('More old decryptable keys than new, should never happen');
    }

    // New keys were able to get decrypted
    const oldAddressKeysSet = new Set<String>(oldAddressKeys.map(({ ID }) => ID));
    const reactivatedKeys = newAddressKeys.filter(({ ID }) => !oldAddressKeysSet.has(ID));
    const reactivatedKeysSet = new Set<String>(reactivatedKeys.map(({ ID }) => ID));

    if (!reactivatedKeysSet.size) {
        return empty;
    }

    const newActiveKeys = await getActiveKeys(address.SignedKeyList, address.Keys, newAddressKeys);
    // Settings default flags needed or not?
    /*
    const newActiveKeysFormatted = newActiveKeys.map((activeKey) => {
        if (!reactivatedKeysSet.has(activeKey.ID)) {
            return activeKey;
        }
        return {
            ...activeKey,
            flags: getDefaultKeyFlags(),
        };
    });
     */

    return {
        address,
        reactivatedKeys,
        signedKeyList: await getSignedKeyList(newActiveKeys),
    };
};

export const getAddressReactivationPayload = (results: GetReactivateAddressKeysReturnValue[]) => {
    const AddressKeyFingerprints = unique(
        results.reduce<KeyPair[]>((acc, { reactivatedKeys }) => {
            if (!reactivatedKeys) {
                return acc;
            }
            return acc.concat(reactivatedKeys);
        }, [])
    ).map(({ privateKey }) => privateKey.getFingerprint());

    const SignedKeyLists = results.reduce<{ [key: string]: SignedKeyList }>((acc, result) => {
        if (!result.reactivatedKeys?.length || !result.signedKeyList) {
            throw new Error('Missing reactivated keys');
        }
        acc[result.address.ID] = result.signedKeyList;
        return acc;
    }, {});

    return {
        AddressKeyFingerprints,
        SignedKeyLists,
    };
};

interface GetReactivatedAddressesKeys {
    addresses: tsAddress[];
    oldUserKeys: KeyPair[];
    newUserKeys: KeyPair[];
    user: tsUser;
    keyPassword: string;
}

export const getReactivatedAddressesKeys = async ({
    addresses,
    oldUserKeys,
    newUserKeys,
    user,
    keyPassword,
}: GetReactivatedAddressesKeys) => {
    const promises = addresses.map((address) =>
        getReactivatedAddressKeys({
            address,
            oldUserKeys,
            newUserKeys,
            user,
            keyPassword,
        })
    );
    const results = await Promise.all(promises);
    return results.filter(({ reactivatedKeys }) => {
        if (!reactivatedKeys) {
            return false;
        }
        return reactivatedKeys.length > 0;
    });
};
