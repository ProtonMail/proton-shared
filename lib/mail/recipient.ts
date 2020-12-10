import { Recipient } from '../interfaces';
import { ContactEmail } from '../interfaces/contacts';

export const REGEX_RECIPIENT = /(.*?)\s*<([^>]*)>/;

export const inputToRecipient = (input: string) => {
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
export const contactToRecipient = (contact: ContactEmail, groupPath?: string) => ({
    Name: contact.Name,
    Address: contact.Email,
    ContactID: contact.ContactID,
    Group: groupPath,
});

export const majorToRecipient = (email: string) => ({
    Name: email,
    Address: email,
});

export const recipientToInput = (recipient: Recipient): string => {
    if (recipient.Address && recipient.Name && recipient.Address !== recipient.Name) {
        return `${recipient.Name} <${recipient.Address}>`;
    }

    if (recipient.Address === recipient.Name) {
        return recipient.Address || '';
    }

    return `${recipient.Name} ${recipient.Address}`;
};

export const contactToInput = (contact: ContactEmail): string => recipientToInput(contactToRecipient(contact));
