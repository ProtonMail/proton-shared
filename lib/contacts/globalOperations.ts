import { getContact, updateContact } from '../api/contacts';
import { CONTACT_CARD_TYPE } from '../constants';
import { Api, CachedKey } from '../interfaces';
import { Contact } from '../interfaces/contacts';
import { getKeyUsedForContact } from './keyVerifications';

/**
 * Process all contacts and update each of them without the content encrypted with the given key
 */
export const dropDataEncryptedWithAKey = async (
    contacts: Contact[],
    key: CachedKey,
    api: Api,
    progressionCallback: (index: number) => void
) => {
    for (let i = 0; i < contacts.length; i++) {
        const contactID = contacts[i].ID;
        const { Contact } = await api<{ Contact: Contact }>(getContact(contactID));
        const match = await getKeyUsedForContact(Contact, [key]);
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
