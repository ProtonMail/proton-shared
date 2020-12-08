import { getKeys, getMessage } from 'pmcrypto';
import { CONTACT_CARD_TYPE } from '../constants';
import { CachedKey } from '../interfaces';
import { Contact } from '../interfaces/contacts';

export interface KeyId {
    equals(keyid: KeyId): boolean;
}

export interface KeyWithIds {
    key: CachedKey;
    ids: KeyId[];
}

/**
 * Get all the key ids of each user keys
 */
export const getUserKeyIds = async (userKeys: CachedKey[]) => {
    return Promise.all(
        userKeys.map(async (userKey) => {
            const key = await getKeys(userKey.Key.PrivateKey);
            return { key: userKey, ids: key[0].getKeyIds() as KeyId[] } as KeyWithIds;
        })
    );
};

/**
 * Get all key ids of the encryption keys of the cards of a contact
 * Technically each cards could be encrypted with different keys but it should never happen
 * So we simplify by returning a flatten array of keys
 */
export const getContactKeyIds = async (contact: Contact) => {
    const encryptedCards =
        contact?.Cards.filter(
            (card) => card.Type === CONTACT_CARD_TYPE.ENCRYPTED_AND_SIGNED || card.Type === CONTACT_CARD_TYPE.ENCRYPTED
        ) || [];

    return (
        await Promise.all(
            encryptedCards.map(async (card) => {
                const message = await getMessage(card.Data);
                return message.getEncryptionKeyIds() as KeyId[];
            })
        )
    ).flat();
};

/**
 * Return first match of the keyWithIds in the keyIds list
 */
export const matchKeys = (keysWithIds: KeyWithIds[], keyIdsToFind: KeyId[]) => {
    const result = keysWithIds.find(
        ({ ids }) =>
            ids.filter((idFromKey) => keyIdsToFind.filter((keyIdToFind) => idFromKey.equals(keyIdToFind)).length > 0)
                .length > 0
    );

    return result?.key;
};

/**
 * Get user key used to encrypt this contact considering there is only one
 */
export const getKeyUsedForContact = async (contact: Contact, userKeys: CachedKey[]) => {
    const userKeysIds = await getUserKeyIds(userKeys);
    const contactKeyIds = await getContactKeyIds(contact);
    return matchKeys(userKeysIds, contactKeyIds);
};
