import { generateKey, OpenPGPKey } from 'pmcrypto';
import { User as tsUser, Address as tsAddress, Key } from '../../lib/interfaces';
import {
    generateAddressKeyTokens,
    generateUserKey,
    getDecryptedUserKeys,
    getDecryptedAddressKeys,
} from '../../lib/keys';
import {
    getAddressReactivationPayload,
    getReactivatedAddressesKeys,
    getReactivatedAddressKeys,
} from '../../lib/keys/reactivation/reactivateKeyHelper';

const DEFAULT_KEYPASSWORD = '1';

const getUserKey = async (ID: string, keyPassword: string) => {
    const { privateKeyArmored } = await generateUserKey({ passphrase: keyPassword });
    return {
        ID,
        PrivateKey: privateKeyArmored,
        Version: 3,
    } as Key;
};

const getAddressKey = async (ID: string, userKey: OpenPGPKey, email: string) => {
    const result = await generateAddressKeyTokens(userKey);

    const key = await generateKey({
        userIds: [{ name: email, email }],
        passphrase: result.token,
        curve: 'ed25519',
    });

    return {
        ID,
        PrivateKey: key.privateKeyArmored,
        Signature: result.signature,
        Token: result.encryptedToken,
        Version: 3,
    } as Key;
};

const getSetup1 = async () => {
    const keyPassword = DEFAULT_KEYPASSWORD;
    const UserKeys = await Promise.all([getUserKey('1', keyPassword), getUserKey('2', keyPassword)]);
    const User = ({
        Keys: UserKeys,
    } as unknown) as tsUser;
    const address1 = 'test@test.com';
    const userKeys = await getDecryptedUserKeys({ user: User, userKeys: UserKeys, keyPassword });
    const addressKeys = await Promise.all([
        getAddressKey('a', userKeys[0].privateKey, address1),
        getAddressKey('b', userKeys[0].privateKey, address1),
        getAddressKey('c', userKeys[1].privateKey, address1),
    ]);
    const Address = ({
        ID: 'AddressID',
        Email: address1,
        Keys: addressKeys,
    } as unknown) as tsAddress;
    return {
        User,
        Address,
        userKeys,
        addressKeys: await getDecryptedAddressKeys({
            addressKeys,
            address: Address,
            user: User,
            userKeys,
            keyPassword,
        }),
    };
};

const getSetup2 = async () => {
    const keyPassword = DEFAULT_KEYPASSWORD;
    const UserKeys = await Promise.all([
        getUserKey('1', keyPassword),
        getUserKey('2', keyPassword),
        getUserKey('3', keyPassword),
        getUserKey('4', keyPassword),
    ]);
    const User = ({
        Keys: UserKeys,
    } as unknown) as tsUser;
    const address1 = 'test@test.com';
    const userKeys = await getDecryptedUserKeys({ user: User, userKeys: UserKeys, keyPassword });
    const AddressKeys1 = await Promise.all([
        getAddressKey('1a', userKeys[0].privateKey, address1),
        getAddressKey('1b', userKeys[0].privateKey, address1),
        getAddressKey('1c', userKeys[1].privateKey, address1),
        getAddressKey('1d', userKeys[2].privateKey, address1),
    ]);
    const address2 = 'test2@test.com';
    const AddressKeys2 = await Promise.all([
        getAddressKey('2a', userKeys[1].privateKey, address2),
        getAddressKey('2b', userKeys[1].privateKey, address2),
        getAddressKey('2c', userKeys[2].privateKey, address2),
        getAddressKey('2d', userKeys[2].privateKey, address2),
        getAddressKey('2e', userKeys[3].privateKey, address2),
    ]);
    const Address1 = ({
        ID: 'AddressID-1',
        Email: address1,
        Keys: AddressKeys1,
    } as unknown) as tsAddress;
    const Address2 = ({
        ID: 'AddressID-2',
        Email: address2,
        Keys: AddressKeys2,
    } as unknown) as tsAddress;
    return {
        User,
        Addresses: [Address1, Address2],
        userKeys,
        addressKeys1: await getDecryptedAddressKeys({
            addressKeys: AddressKeys1,
            address: Address1,
            user: User,
            userKeys,
            keyPassword,
        }),
        addressKeys2: await getDecryptedAddressKeys({
            addressKeys: AddressKeys2,
            address: Address2,
            user: User,
            userKeys,
            keyPassword,
        }),
    };
};

describe('reactivate address keys', () => {
    it('should return an empty result', async () => {
        const { User, Address, userKeys } = await getSetup1();
        const result = await getReactivatedAddressKeys({
            user: User,
            address: Address,
            oldUserKeys: userKeys,
            newUserKeys: userKeys,
            keyPassword: '',
        });
        expect(result).toEqual({
            address: Address,
            reactivatedKeys: undefined,
            signedKeyList: undefined,
        });
    });

    it('should return keys that got reactivated', async () => {
        const { User, Address, userKeys } = await getSetup1();
        const result = await getReactivatedAddressKeys({
            user: User,
            address: Address,
            oldUserKeys: [userKeys[0]],
            newUserKeys: userKeys,
            keyPassword: '',
        });
        expect(result).toEqual(
            jasmine.objectContaining({
                address: Address,
                reactivatedKeys: jasmine.any(Array),
                signedKeyList: jasmine.any(Object),
            })
        );
    });

    it('should get correct payload from keys that got reactivated', async () => {
        const { User, Address, userKeys, addressKeys } = await getSetup1();
        const result = await getReactivatedAddressKeys({
            user: User,
            address: Address,
            oldUserKeys: [userKeys[0]],
            newUserKeys: userKeys,
            keyPassword: '',
        });
        const payload = await getAddressReactivationPayload([result]);
        expect(payload).toEqual(
            jasmine.objectContaining({
                AddressKeyFingerprints: [...[addressKeys[2]].map(({ privateKey }) => privateKey.getFingerprint())],
                SignedKeyLists: {
                    [Address.ID]: {
                        Data: jasmine.any(String),
                        Signature: jasmine.any(String),
                    },
                },
            })
        );
    });

    it('should get correct payload from keys that got reactivated on multiple addresses', async () => {
        const { User, Addresses, userKeys, addressKeys1, addressKeys2 } = await getSetup2();
        const result = await getReactivatedAddressesKeys({
            user: User,
            addresses: Addresses,
            oldUserKeys: [userKeys[0]],
            newUserKeys: [userKeys[0], userKeys[1]],
            keyPassword: '',
        });
        const payload = await getAddressReactivationPayload(result);
        expect(payload).toEqual(
            jasmine.objectContaining({
                AddressKeyFingerprints: [
                    ...[addressKeys1[2], addressKeys2[0], addressKeys2[1]].map(({ privateKey }) =>
                        privateKey.getFingerprint()
                    ),
                ],
                SignedKeyLists: {
                    [Addresses[0].ID]: {
                        Data: jasmine.any(String),
                        Signature: jasmine.any(String),
                    },
                    [Addresses[1].ID]: {
                        Data: jasmine.any(String),
                        Signature: jasmine.any(String),
                    },
                },
            })
        );
    });
});
