import { Recipient } from '../interfaces';
import { ContactEmail } from '../interfaces/contacts';

export const REGEX_RECIPIENT = /(.*?)\s*<([^>]*)>/;

export const inputToRecipient = (input: string): Recipient => {
    const match = REGEX_RECIPIENT.exec(input);

    if (match !== null) {
        return {
            Name: match[1],
            Address: match[2],
        };
    }
    return {
        Name: input,
        Address: input,
    };
};
export const contactToRecipient = (contact: Partial<ContactEmail> = {}, groupPath?: string): Partial<Recipient> => ({
    Name: contact.Name,
    Address: contact.Email,
    ContactID: contact.ContactID,
    Group: groupPath,
});

export const majorToRecipient = (email: string): Partial<Recipient> => ({
    Name: email,
    Address: email,
});

export const recipientToInput = (recipient: Partial<Recipient> = {}): string => {
    if (recipient.Address && recipient.Name && recipient.Address !== recipient.Name) {
        return `${recipient.Name} <${recipient.Address}>`;
    }

    if (recipient.Address === recipient.Name) {
        return recipient.Address || '';
    }

    return `${recipient.Name} ${recipient.Address}`;
};

export const contactToInput = (contact: Partial<ContactEmail> = {}): string =>
    recipientToInput(contactToRecipient(contact));
