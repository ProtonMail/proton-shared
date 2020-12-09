import { OpenPGPKey } from 'pmcrypto';
import { getContact, updateContact } from '../api/contacts';
import { CONTACT_CARD_TYPE } from '../constants';
import { Api, CachedKey } from '../interfaces';
import { Contact } from '../interfaces/contacts';
import { getKeyUsedForContact } from './keyVerifications';
import { resignCards } from './resign';

/**
 * Process all contacts and update each of them without the content encrypted with the given key
 */
export const dropDataEncryptedWithAKey = async (
    contacts: Contact[],
    key: CachedKey,
    api: Api,
    progressionCallback: (index: number) => void,
    exitRef: { current: boolean }
) => {
    for (let i = 0; i < contacts.length && !exitRef.current; i++) {
        const contactID = contacts[i].ID;
        const { Contact } = await api<{ Contact: Contact }>(getContact(contactID));
        const match = await getKeyUsedForContact(Contact, [key], true);
        if (match) {
            const Cards = Contact.Cards.filter(
                (card) =>
                    card.Type !== CONTACT_CARD_TYPE.ENCRYPTED && card.Type !== CONTACT_CARD_TYPE.ENCRYPTED_AND_SIGNED
            );
            await api<{ Contact: Contact }>(updateContact(contactID, { Cards }));
        }
        progressionCallback(i + 1);
    }
};

/**
 * Process all contacts and resign each of them with the given key
 */
export const resignWithAKey = async (
    contacts: Contact[],
    keyToMatch: CachedKey,
    keyToUse: CachedKey,
    api: Api,
    progressionCallback: (index: number) => void,
    exitRef: { current: boolean }
) => {
    for (let i = 0; i < contacts.length && !exitRef.current; i++) {
        const contactID = contacts[i].ID;
        const { Contact } = await api<{ Contact: Contact }>(getContact(contactID));
        const match = await getKeyUsedForContact(Contact, [keyToMatch], false);
        if (match) {
            const Cards = await resignCards({
                contactCards: Contact.Cards,
                privateKeys: [keyToUse.privateKey as OpenPGPKey],
            });
            await api<{ Contact: Contact }>(updateContact(contactID, { Cards }));
        }
        progressionCallback(i + 1);
    }
};
