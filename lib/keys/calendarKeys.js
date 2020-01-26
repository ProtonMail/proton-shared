import {
    encryptMessage,
    getMessage,
    getSignature,
    splitMessage,
    decryptMessage,
    createMessage,
    generateKey,
    decryptPrivateKey
} from 'pmcrypto';
import getRandomValues from 'get-random-values';
import { VERIFICATION_STATUS } from 'pmcrypto/lib/constants';
import { c } from 'ttag';

import { ENCRYPTION_TYPES, ENCRYPTION_CONFIGS } from '../constants';
import { normalize } from '../helpers/string';
import { noop } from '../helpers/function';
import { uniqueBy } from '../helpers/array';
import { serializeUint8Array } from '../helpers/serialization';
import { hasBit } from '../helpers/bitset';
import { splitKeys } from './keys';

export const KEY_FLAGS = {
    PRIMARY: 0b1,
    ACTIVE: 0b01
};

/**
 * @return {String}
 */
export const generatePassphrase = () => {
    const value = getRandomValues(new Uint8Array(32));
    return serializeUint8Array(value);
};

/**
 * The calendar key is generated with less user info to not confuse if the key is exported.
 * @param {String} passphrase
 * @param {Object} encryptionConfig
 * @returns {Promise<{privateKeyArmored, privateKey}>}
 */
export const generateCalendarKey = async ({ passphrase, encryptionConfig }) => {
    const { key: privateKey, privateKeyArmored } = await generateKey({
        userIds: [{ name: 'Calendar key' }],
        passphrase,
        ...encryptionConfig
    });

    await privateKey.decrypt(passphrase);

    return { privateKey, privateKeyArmored };
};

/**
 * @param {String} passphrase
 * @param {Object} privateKey
 * @param {Object} memberPublicKeys
 * @returns {Promise<{keyPackets, dataPacket, signature}>}
 */
export const encryptPassphrase = async ({ passphrase, privateKey, memberPublicKeys }) => {
    const memberPublicKeysList = Object.entries(memberPublicKeys);
    const { data, signature } = await encryptMessage({
        message: await createMessage(passphrase),
        publicKeys: memberPublicKeysList.map(([, publicKey]) => publicKey),
        privateKeys: [privateKey],
        detached: true
    });
    const message = await getMessage(data);
    const { asymmetric, encrypted } = await splitMessage(message);

    return {
        keyPackets: memberPublicKeysList.reduce((acc, [memberID], index) => {
            acc[memberID] = serializeUint8Array(asymmetric[index]);
            return acc;
        }, Object.create(null)),
        dataPacket: serializeUint8Array(encrypted[0]),
        signature
    };
};

/**
 * Decrypts a calendar passphrase with a private key
 * @param {String} armoredPassphrase
 * @param {String} armoredSignature
 * @param {Array} privateKeys
 * @param {Array} publicKeys
 * @return {String} - the decrypted passphrase
 */
export const decryptPassphrase = async ({ armoredPassphrase, armoredSignature, privateKeys, publicKeys }) => {
    const { data: decryptedPassphrase, verified } = await decryptMessage({
        message: await getMessage(armoredPassphrase),
        signature: await getSignature(armoredSignature),
        privateKeys,
        publicKeys
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return decryptedPassphrase;
};

/**
 * @param {Array} Members
 * @param {Array} Addresses
 * @return {Object}
 */
export const getAddressesMembersMap = (Members = [], Addresses = []) => {
    return Members.reduce((acc, Member) => {
        const Address = Addresses.find(({ Email }) => Email === Member.Email);
        if (!Address) {
            return acc;
        }
        acc[Member.ID] = Address;
        return acc;
    }, {});
};

/**
 * @param {Array} Keys
 * @param {Array} Passphrases
 * @return {Array}
 */
export const getRequiredPassphrases = (Keys = [], Passphrases = []) => {
    return uniqueBy(Keys, ({ PassphraseID }) => PassphraseID)
        .map(({ PassphraseID }) => Passphrases.find(({ ID }) => ID === PassphraseID))
        .filter(Boolean);
};

/**
 * Decrypt all passphrases for the keys of calendar for a given member and the address keys
 * Verifies the signature against the same key.
 * @param {Array} Passphrases
 * @param {Object} addressesMembersMap
 * @param {Object} addressesKeysMap
 * @return {Promise}
 */
export const decryptCalendarKeysPassphrases = async ({ Passphrases = [], addressesMembersMap, addressesKeysMap }) => {
    const result = await Promise.all(
        Passphrases.map(async ({ MemberPassphrases = [] } = {}) => {
            // Try to decrypt each passphrase with the address keys belonging to that member until it succeeds.
            // eslint-disable-next-line no-restricted-syntax
            for (const { Passphrase, Signature, MemberID } of MemberPassphrases) {
                const Address = addressesMembersMap[MemberID];

                if (!Address || !addressesKeysMap[Address.ID]) {
                    continue;
                }

                const result = await decryptPassphrase({
                    armoredPassphrase: Passphrase,
                    armoredSignature: Signature,
                    ...splitKeys(addressesKeysMap[Address.ID])
                }).catch(noop);

                if (result) {
                    return result;
                }
            }
        })
    );

    return Passphrases.reduce(
        (acc, { ID }, i) => ({
            ...acc,
            [ID]: result[i]
        }),
        {}
    );
};

/**
 * Decrypt the calendar keys.
 * @param {Array} Keys - the calendar keys as coming from the API
 * @param {Object} passphrasesMap - The decrypted passphrases map as returned by `decryptCalendarKeysPassphrases`
 * @return {Promise}
 */
export const decryptCalendarKeys = async (Keys, passphrasesMap = {}) => {
    const process = async (Key) => {
        try {
            const { PrivateKey, PassphraseID } = Key;
            const passphrase = passphrasesMap[PassphraseID];
            const privateKey = await decryptPrivateKey(PrivateKey, passphrase);
            return {
                Key,
                privateKey,
                publicKey: privateKey.toPublic()
            };
        } catch (e) {
            return {
                Key,
                error: e
            };
        }
    };
    return Promise.all(Keys.map(process));
};

export const getDecryptedPassphrase = async ({ privateKeys, publicKeys, MemberID, PassphraseID, Passphrases = [] }) => {
    const { MemberPassphrases = [] } = Passphrases.find(({ ID }) => ID === PassphraseID) || {};
    const { Passphrase, Signature } =
        MemberPassphrases.find(({ MemberID: otherMemberID }) => otherMemberID === MemberID) || {};

    return decryptPassphrase({
        armoredPassphrase: Passphrase,
        armoredSignature: Signature,
        privateKeys,
        publicKeys
    }).catch(noop);
};

/**
 * @param {Array} Keys
 * @returns {Object}
 */
export const getPrimaryKey = (Keys = []) => {
    return Keys.find(({ Flags }) => hasBit(Flags, KEY_FLAGS.PRIMARY));
};

/**
 * Convert a map of email -> value to the corresponding member id -> value
 * @param {Array} Members
 * @param {Object} emailMap
 * @returns {{}}
 */
export const getKeysMemberMap = (Members = [], emailMap = {}) => {
    return Object.keys(emailMap).reduce((acc, email) => {
        const { ID: memberID } = Members.find(({ Email }) => normalize(Email) === normalize(email));
        if (!memberID) {
            throw new Error(c('Error').t`Could not find address ${email}.`);
        }
        acc[memberID] = emailMap[email];
        return acc;
    }, {});
};

/**
 * Generate the payload required for calendar keys.
 * @param {String} addressID
 * @param {PGPKey} privateKey
 * @param {Object} memberPublicKeys
 * @returns {Promise}
 */
export const generateCalendarKeyPayload = async ({ addressID, privateKey, memberPublicKeys }) => {
    const passphrase = generatePassphrase();
    const encryptionConfig = ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.X25519];
    const [
        { privateKeyArmored: PrivateKey },
        { dataPacket: DataPacket, keyPackets: KeyPackets, signature: Signature }
    ] = await Promise.all([
        generateCalendarKey({ passphrase, encryptionConfig }),
        encryptPassphrase({ passphrase, privateKey, memberPublicKeys })
    ]);

    return {
        AddressID: addressID,
        Signature,
        PrivateKey,
        Passphrase: {
            DataPacket,
            KeyPackets
        }
    };
};
