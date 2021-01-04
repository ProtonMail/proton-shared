import { Contact } from '../interfaces/contacts';
import { CONTACT_CARD_TYPE } from '../constants';
import { parse } from './vcard';

/**
 * NOTE: Does not verify the signature of the card. This is intended since it should only be used in places where it doesn't matter.
 */
export const getEmailsFromContact = (contact: Contact) => {
    const signedCard = contact.Cards.find(({ Type }) => Type === CONTACT_CARD_TYPE.SIGNED);
    if (!signedCard) {
        return [];
    }
    const properties = parse(signedCard.Data);
    const emailProperties = properties.filter(({ field, group }) => field === 'email' && group !== undefined);
    return emailProperties.map((property) => {
        if (Array.isArray(property.value)) {
            return '';
        }
        return property.value;
    });
};
