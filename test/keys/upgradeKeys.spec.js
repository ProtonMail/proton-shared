import { decryptPrivateKey, generateKey } from 'pmcrypto';
import { upgradeV2KeysHelper } from '../../lib/keys/upgradeKeysV2';
import { Modulus } from '../authentication/login.data';

const DEFAULT_EMAIL = 'test@test.com';
const DEFAULT_KEYPASSWORD = '1';

const getKey = (email = DEFAULT_EMAIL, keyPassword = DEFAULT_KEYPASSWORD) => {
    return generateKey({
        userIds: [{ name: email, email }],
        passphrase: keyPassword,
        curve: 'ed25519',
    });
};

describe('upgrade keys v2', () => {
    describe('do upgrade', () => {
        it('should upgrade v2 keys', async () => {
            const keyPassword = DEFAULT_KEYPASSWORD;
            const [userKey1, userKey2, addressKey1, addressKey2, addressKey3] = await Promise.all([
                getKey(),
                getKey(),
                getKey(),
                getKey(),
                getKey(),
            ]);
            const User = {
                Keys: [
                    {
                        ID: 'a',
                        PrivateKey: userKey1.privateKeyArmored,
                        Version: 2,
                    },
                    {
                        ID: 'b',
                        PrivateKey: userKey2.privateKeyArmored,
                        Version: 2,
                    },
                ],
            };
            const Addresses = [
                {
                    Email: 'test@test.com',
                    Keys: [
                        {
                            ID: 'c',
                            PrivateKey: addressKey1.privateKeyArmored,
                            Version: 2,
                        },
                        {
                            ID: 'd',
                            PrivateKey: addressKey2.privateKeyArmored,
                            Version: 2,
                        },
                    ],
                },
                {
                    Email: 'test2@test.com',
                    Keys: [
                        {
                            ID: 'e',
                            PrivateKey: addressKey3.privateKeyArmored,
                            Version: 2,
                        },
                    ],
                },
            ];
            const api = jasmine.createSpy('api').and.returnValues(Promise.resolve({ Modulus }), Promise.resolve());
            const newKeyPassword = await upgradeV2KeysHelper({
                User,
                Addresses,
                loginPassword: keyPassword,
                keyPassword,
                clearKeyPassword: keyPassword,
                isOnePasswordMode: true,
                api,
            });
            expect(api.calls.all().length).toBe(2);
            const newKeysArgs = api.calls.all()[1].args[0];
            const decryptedKeys = await Promise.all(
                newKeysArgs.data.Keys.map(({ PrivateKey }) => {
                    return decryptPrivateKey(PrivateKey, newKeyPassword);
                })
            );
            expect(decryptedKeys.every((key) => key.isDecrypted())).toBe(true);
            expect(decryptedKeys.length).toBe(5);
            expect(newKeysArgs.data.Keys[0].PrivateKey);
            expect(newKeysArgs).toEqual({
                url: 'keys/private/upgrade',
                method: 'post',
                data: jasmine.objectContaining({
                    KeySalt: 'AAECAwQFBgcICQoLDA0ODw==',
                    Auth: jasmine.any(Object),
                    Keys: jasmine.any(Array),
                }),
            });
            expect(newKeyPassword).toBe('RDn2zC9IHLTbaTSx5g2YPujCkT59mqW');
        });

        it('should upgrade v2 keys in two password mode', async () => {
            const keyPassword = DEFAULT_KEYPASSWORD;
            const [userKey1, userKey2, addressKey1, addressKey2] = await Promise.all([
                getKey(),
                getKey(),
                getKey(),
                getKey(),
            ]);
            const User = {
                Keys: [
                    {
                        ID: 'a',
                        PrivateKey: userKey1.privateKeyArmored,
                        Version: 2,
                    },
                    {
                        ID: 'b',
                        PrivateKey: userKey2.privateKeyArmored,
                        Version: 2,
                    },
                ],
            };
            const Addresses = [
                {
                    Email: 'test@test.com',
                    Keys: [
                        {
                            ID: 'c',
                            PrivateKey: addressKey1.privateKeyArmored,
                            Version: 2,
                        },
                        {
                            ID: 'd',
                            PrivateKey: addressKey2.privateKeyArmored,
                            Version: 2,
                        },
                    ],
                },
            ];
            const api = jasmine.createSpy('api').and.returnValues(Promise.resolve());
            const newKeyPassword = await upgradeV2KeysHelper({
                User,
                Addresses,
                loginPassword: '123',
                keyPassword,
                clearKeyPassword: keyPassword,
                isOnePasswordMode: false,
                api,
            });
            expect(api.calls.all().length).toBe(1);
            const newKeysArgs = api.calls.all()[0].args[0];
            const decryptedKeys = await Promise.all(
                newKeysArgs.data.Keys.map(({ PrivateKey }) => {
                    return decryptPrivateKey(PrivateKey, newKeyPassword);
                })
            );
            expect(decryptedKeys.length).toBe(4);
            expect(decryptedKeys.every((key) => key.isDecrypted())).toBe(true);
            expect(newKeysArgs.data.Keys[0].PrivateKey);
            expect(newKeysArgs).toEqual({
                url: 'keys/private/upgrade',
                method: 'post',
                data: jasmine.objectContaining({
                    KeySalt: 'AAECAwQFBgcICQoLDA0ODw==',
                    Keys: jasmine.any(Array),
                }),
            });
            expect(newKeyPassword).toBe('RDn2zC9IHLTbaTSx5g2YPujCkT59mqW');
        });

        it('should upgrade v2 and v3 keys mixed', async () => {
            const keyPassword = DEFAULT_KEYPASSWORD;
            const [userKey1, userKey2, addressKey1, addressKey2] = await Promise.all([
                getKey(),
                getKey(),
                getKey(),
                getKey(),
            ]);
            const User = {
                Keys: [
                    {
                        ID: 'a',
                        PrivateKey: userKey1.privateKeyArmored,
                        Version: 3,
                    },
                    {
                        ID: 'b',
                        PrivateKey: userKey2.privateKeyArmored,
                        Version: 2,
                    },
                ],
            };
            const Addresses = [
                {
                    Email: 'test@test.com',
                    Keys: [
                        {
                            ID: 'c',
                            PrivateKey: addressKey1.privateKeyArmored,
                            Version: 3,
                        },
                        {
                            ID: 'd',
                            PrivateKey: addressKey2.privateKeyArmored,
                            Version: 2,
                        },
                    ],
                },
            ];
            const api = jasmine.createSpy('api').and.returnValues(Promise.resolve());
            const newKeyPassword = await upgradeV2KeysHelper({
                User,
                Addresses,
                loginPassword: '123',
                keyPassword,
                clearKeyPassword: keyPassword,
                isOnePasswordMode: false,
                api,
            });
            expect(api.calls.all().length).toBe(1);
            const newKeysArgs = api.calls.all()[0].args[0];
            const decryptedKeys = await Promise.all(
                newKeysArgs.data.Keys.map(({ PrivateKey }) => {
                    return decryptPrivateKey(PrivateKey, newKeyPassword);
                })
            );
            expect(decryptedKeys.length).toBe(4);
            expect(decryptedKeys.every((key) => key.isDecrypted())).toBe(true);
            expect(newKeysArgs.data.Keys[0].PrivateKey);
            expect(newKeysArgs).toEqual({
                url: 'keys/private/upgrade',
                method: 'post',
                data: jasmine.objectContaining({
                    KeySalt: 'AAECAwQFBgcICQoLDA0ODw==',
                    Keys: jasmine.any(Array),
                }),
            });
            expect(newKeyPassword).toBe('RDn2zC9IHLTbaTSx5g2YPujCkT59mqW');
        });
    });

    describe('do not upgrade', () => {
        it('should not upgrade if the v2 keys cannot be decrypted', async () => {
            const email = 'test@test.com';
            const keyPassword = '1';
            const [userKey1, addressKey1, addressKey2] = await Promise.all([
                getKey(),
                getKey(),
                getKey('test@test.com', '123'),
            ]);
            const User = {
                Keys: [
                    {
                        ID: 'a',
                        PrivateKey: userKey1.privateKeyArmored,
                        Version: 3,
                    },
                ],
            };
            const Addresses = [
                {
                    Email: email,
                    Keys: [
                        {
                            ID: 'b',
                            PrivateKey: addressKey1.privateKeyArmored,
                            Version: 3,
                        },
                        {
                            ID: 'c',
                            PrivateKey: addressKey2.privateKeyArmored,
                            Version: 2,
                        },
                    ],
                },
            ];
            const api = jasmine.createSpy('api').and.returnValues(Promise.resolve());
            const newKeyPassword = await upgradeV2KeysHelper({
                User,
                Addresses,
                loginPassword: keyPassword,
                keyPassword,
                clearKeyPassword: keyPassword,
                isOnePasswordMode: false,
                api,
            });
            expect(api.calls.all().length).toBe(0);
            expect(newKeyPassword).toBeUndefined();
        });

        it('should not upgrade if there are no v2 keys', async () => {
            const email = 'test@test.com';
            const keyPassword = '1';
            const [userKey1, addressKey1, addressKey2] = await Promise.all([getKey(), getKey(), getKey()]);
            const User = {
                Keys: [
                    {
                        ID: 'a',
                        PrivateKey: userKey1.privateKeyArmored,
                        Version: 3,
                    },
                ],
            };
            const Addresses = [
                {
                    Email: email,
                    Keys: [
                        {
                            ID: 'c',
                            PrivateKey: addressKey1.privateKeyArmored,
                            Version: 3,
                        },
                        {
                            ID: 'd',
                            PrivateKey: addressKey2.privateKeyArmored,
                            Version: 3,
                        },
                    ],
                },
            ];
            const api = jasmine.createSpy('api').and.returnValues(Promise.resolve({ Modulus }), Promise.resolve());
            const newKeyPassword = await upgradeV2KeysHelper({
                User,
                Addresses,
                loginPassword: keyPassword,
                keyPassword,
                clearKeyPassword: keyPassword,
                isOnePasswordMode: true,
                api,
            });
            expect(api.calls.all().length).toBe(0);
            expect(newKeyPassword).toBeUndefined();
        });
    });
});