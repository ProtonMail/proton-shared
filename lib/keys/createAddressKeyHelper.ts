import { OpenPGPKey } from 'pmcrypto';
import { createAddressKeyRoute } from '../api/keys';
import { Address, ActionableKey, Api, CachedKey } from '../interfaces';

import { addKeyAction } from './keysAction';
import { getDefaultKeyFlags } from './keyFlags';
import getSignedKeyList from './getSignedKeyList';

interface CreateKeyArguments {
    api: Api;
    signingKey: OpenPGPKey;
    privateKey: OpenPGPKey;
    privateKeyArmored: string;
    parsedKeys: CachedKey[];
    actionableKeys: ActionableKey[];
    Address: Address;
}

export default async ({
    api,
    privateKey,
    privateKeyArmored,
    signingKey,
    parsedKeys,
    actionableKeys,
    Address,
}: CreateKeyArguments) => {
    const updatedKeys = addKeyAction({
        ID: 'temp',
        flags: getDefaultKeyFlags(),
        parsedKeys,
        actionableKeys,
        privateKey,
    });

    const createdKey = updatedKeys.find(({ ID }) => ID === 'temp');
    if (!createdKey) {
        throw new Error('Temp key not found');
    }
    const { primary } = createdKey;

    const { Key } = await api(
        createAddressKeyRoute({
            AddressID: Address.ID,
            Primary: primary,
            PrivateKey: privateKeyArmored,
            SignedKeyList: await getSignedKeyList(updatedKeys, signingKey),
        })
    );

    // Mutably update the key with the latest value from the real ID.
    createdKey.ID = Key.ID;

    return updatedKeys;
};
