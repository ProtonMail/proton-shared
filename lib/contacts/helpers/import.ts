import { c } from 'ttag';

import { CONTACT_CARD_TYPE, FORBIDDEN_LABEL_NAMES } from '../../constants';
import isTruthy from '../../helpers/isTruthy';
import { normalize } from '../../helpers/string';
import {
    ContactGroup,
    ContactMetadata,
    ContactProperties,
    IMPORT_GROUPS_ACTION,
    ImportCategories,
    ImportedContact,
} from '../../interfaces/contacts';
import {
    ACCEPTED_EXTENSIONS,
    EncryptedContact,
    EXTENSION,
    ImportContactsModel,
} from '../../interfaces/contacts/Import';
import { SimpleMap } from '../../interfaces/utils';

import { IMPORT_CONTACT_ERROR_TYPE, ImportContactError } from '../errors/ImportContactError';

import { hasCategories } from '../properties';
import { parse as parseVcard } from '../vcard';

export const getIsAcceptedExtension = (extension: string): extension is ACCEPTED_EXTENSIONS => {
    return Object.values(EXTENSION).includes(extension as EXTENSION);
};

export const getHasPreVcardsContacts = (
    model: ImportContactsModel
): model is ImportContactsModel & Required<Pick<ImportContactsModel, 'preVcardsContacts'>> => {
    return !!model.preVcardsContacts;
};

/**
 * Try to get a string that identifies a contact. This will be used in case of errors
 */
export const getContactId = (vcardOrContactProperties: string | ContactProperties) => {
    if (Array.isArray(vcardOrContactProperties)) {
        const fn = vcardOrContactProperties.filter(({ field }) => field === 'fn')[0]?.value;
        if (fn) {
            return fn as string;
        }
        const email = vcardOrContactProperties.filter(({ field }) => field === 'email')[0]?.value;
        if (email) {
            return email as string;
        }
        return c('Import contact. Contact identifier').t`unknown`;
    }
    // try to get the name of the contact from FN, which is a required field in a vcard
    const [, fn] = vcardOrContactProperties.match(/FN(?:;[^\r\n]*)*:([^\r\n]*)\s/) || [];
    if (fn) {
        return fn;
    }
    return c('Import contact. Contact identifier').t`unknown`;
};

export const getSupportedContact = (vcard: string) => {
    if (vcard.includes('VERSION:2.1')) {
        const contactId = getContactId(vcard);
        return new ImportContactError(IMPORT_CONTACT_ERROR_TYPE.UNSUPPORTED_VCARD_VERSION, contactId);
    }
    try {
        return parseVcard(vcard);
    } catch (error) {
        const contactId = getContactId(vcard);
        return new ImportContactError(IMPORT_CONTACT_ERROR_TYPE.EXTERNAL_ERROR, contactId, error);
    }
};

export const getSupportedContacts = (vcards: string[]) => {
    return vcards
        .map((vcard) => {
            try {
                return getSupportedContact(vcard);
            } catch (error) {
                if (error instanceof ImportContactError) {
                    return error;
                }
                const contactId = getContactId(vcard);
                return new ImportContactError(IMPORT_CONTACT_ERROR_TYPE.EXTERNAL_ERROR, contactId, error);
            }
        })
        .filter(isTruthy);
};

export const haveCategories = (contacts: ImportedContact[]) => {
    return contacts.some(({ categories }) => categories.some((category) => category.contactEmailIDs?.length));
};

/**
 * Extract the info about categories relevant for importing groups, i.e.
 * extract categories with corresponding contact email ids (if any) for a submitted contact
 */
export const extractContactImportCategories = (
    contact: ContactMetadata,
    { categories, contactEmails }: EncryptedContact
) => {
    const withGroup = categories.map(({ name, group }) => {
        const matchingContactEmailIDs = contactEmails
            .filter(
                ({ group: emailGroup }) =>
                    // If category group is not defined, we consider it applies to all email
                    group === undefined ||
                    // If category group is defined, we consider it has to match with the email group
                    emailGroup === group
            )
            .map(({ email }) => {
                const { ID } = contact.ContactEmails.find(({ Email }) => Email === email) || {};
                return ID;
            })
            .filter(isTruthy);

        if (!matchingContactEmailIDs.length) {
            return { name };
        }
        return { name, contactEmailIDs: matchingContactEmailIDs };
    });
    const categoriesMap = withGroup.reduce<SimpleMap<string[]>>((acc, { name, contactEmailIDs = [] }) => {
        const category = acc[name];
        if (category && contactEmailIDs.length) {
            category.push(...contactEmailIDs);
        } else {
            acc[name] = [...contactEmailIDs];
        }
        return acc;
    }, {});

    return Object.entries(categoriesMap).map(([name, contactEmailIDs]) => ({ name, contactEmailIDs }));
};

/**
 * Given a list of imported contacts, get a list of the categories that can be imported, each of them with
 * a list of contactEmailIDs or contactIDs plus total number of contacts that would go into the category
 */
export const getImportCategories = (contacts: ImportedContact[]) => {
    const allCategoriesMap = contacts.reduce<
        SimpleMap<Pick<ImportCategories, 'contactEmailIDs' | 'contactIDs' | 'totalContacts'>>
    >((acc, { contactID, categories, contactEmailIDs: contactEmailIDsOfContact }) => {
        if (
            // No categories to consider
            !categories.length ||
            // We ignore groups on contact with no email
            !contactEmailIDsOfContact.length
        ) {
            return acc;
        }
        categories.forEach(({ name, contactEmailIDs = [] }) => {
            const category = acc[name];
            if (contactEmailIDs.length === 0) {
                // We ignore groups on contact if no email are assigned
                return;
            }
            if (!category) {
                if (contactEmailIDs.length === contactEmailIDsOfContact.length) {
                    acc[name] = { contactEmailIDs: [], contactIDs: [contactID], totalContacts: 1 };
                } else {
                    acc[name] = { contactEmailIDs: [...contactEmailIDs], contactIDs: [], totalContacts: 1 };
                }
            } else if (contactEmailIDs.length === contactEmailIDsOfContact.length) {
                acc[name] = {
                    contactEmailIDs: category.contactEmailIDs,
                    contactIDs: [...category.contactIDs, contactID],
                    totalContacts: category.totalContacts + 1,
                };
            } else {
                acc[name] = {
                    contactEmailIDs: [...category.contactEmailIDs, ...contactEmailIDs],
                    contactIDs: category.contactIDs,
                    totalContacts: category.totalContacts + 1,
                };
            }
        });
        return acc;
    }, {});

    return Object.entries(allCategoriesMap)
        .map(([name, value]) => {
            if (!value) {
                return;
            }
            return {
                name,
                contactEmailIDs: value.contactEmailIDs,
                contactIDs: value.contactIDs,
                totalContacts: value.totalContacts,
            };
        })
        .filter(isTruthy);
};

export const getImportCategoriesModel = (contacts: ImportedContact[], groups: ContactGroup[] = []) => {
    const categories = getImportCategories(contacts).map((category) => {
        const existingGroup = groups.find(({ Name }) => Name === category.name);
        const action = existingGroup && groups.length ? IMPORT_GROUPS_ACTION.MERGE : IMPORT_GROUPS_ACTION.CREATE;
        const targetGroup = existingGroup || groups[0];
        const targetName = existingGroup ? '' : category.name;
        const result: ImportCategories = {
            ...category,
            action,
            targetGroup,
            targetName,
        };
        if (action === IMPORT_GROUPS_ACTION.CREATE && FORBIDDEN_LABEL_NAMES.includes(normalize(targetName))) {
            result.error = c('Error').t`Invalid name`;
        }
        return result;
    });
    return categories;
};

export const splitErrors = <T>(contacts: (T | ImportContactError)[]) => {
    return contacts.reduce<{ errors: ImportContactError[]; rest: T[] }>(
        (acc, contact) => {
            if (contact instanceof ImportContactError) {
                acc.errors.push(contact);
            } else {
                acc.rest.push(contact);
            }
            return acc;
        },
        { errors: [], rest: [] }
    );
};

/**
 * Split contacts depending on having the CATEGORIES property.
 * @param contacts
 */
export const splitContacts = (contacts: ContactProperties[] = []) =>
    contacts.reduce<{ withCategories: ContactProperties[]; withoutCategories: ContactProperties[] }>(
        (acc, contact) => {
            if (hasCategories(contact)) {
                acc.withCategories.push(contact);
            } else {
                acc.withoutCategories.push(contact);
            }
            return acc;
        },
        { withCategories: [], withoutCategories: [] }
    );

/**
 * Split encrypted contacts depending on having the CATEGORIES property.
 */
export const splitEncryptedContacts = (contacts: EncryptedContact[] = []) =>
    contacts.reduce<{ withCategories: EncryptedContact[]; withoutCategories: EncryptedContact[] }>(
        (acc, contact) => {
            const {
                contact: { Cards, error },
            } = contact;
            if (error) {
                return acc;
            }
            if (Cards.some(({ Type, Data }) => Type === CONTACT_CARD_TYPE.CLEAR_TEXT && Data.includes('CATEGORIES'))) {
                acc.withCategories.push(contact);
            } else {
                acc.withoutCategories.push(contact);
            }
            return acc;
        },
        { withCategories: [], withoutCategories: [] }
    );
