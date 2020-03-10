import { c } from 'ttag';
import { getKeys, OpenPGPKey } from 'pmcrypto';

import { getPublicKeys } from '../keys';
import { noop } from '../../helpers/function';
import { getContact, queryContactEmails } from '../contacts';
import { parse } from '../../contacts/vcard';
import { getKeyInfoFromProperties } from '../../contacts/property';
import { Api, ApiKeysConfig, PinnedKeysConfig } from '../../interfaces';
import { ContactEmail } from '../../interfaces/contacts/Contact';
import { CONTACT_CARD_TYPE, KEY_FLAGS } from '../../constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';

const { KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID } = API_CUSTOM_ERROR_CODES;
const EMAIL_ERRORS = [KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID];

/**
 * Ask the API for public keys for a given email address. The response will contain keys both
 * for internal users and for external users with WKD keys
 */
export const getPublicKeysEmailHelper = async (api: Api, Email: string): Promise<ApiKeysConfig> => {
    try {
        const { Keys = [], ...rest } = await api(getPublicKeys({ Email }));
        const isVerificationOnly: { [key: string]: boolean } = {};
        const publicKeys = (await Promise.all(
            Keys.map(
                ({ Flags, PublicKey }) =>
                    getKeys(PublicKey)
                        .then(([publicKey]) => {
                            isVerificationOnly[publicKey.getFingerprint()] = !(Flags & KEY_FLAGS.ENABLE_ENCRYPTION);
                            return publicKey;
                        })
                        .catch(noop)
                // eslint-disable-next-line
            )
        )) as OpenPGPKey[];
        return {
            ...rest,
            Keys,
            publicKeys,
            isVerificationOnly
        };
    } catch (error) {
        const { data = {} } = error;
        if (EMAIL_ERRORS.includes(data.Code)) {
            return { Keys: [], publicKeys: [], isVerificationOnly: {} };
        }
        throw error;
    }
};

export const getPublicKeysVcardHelper = async (api: Api, Email: string): Promise<PinnedKeysConfig> => {
    const defaultConfig: PinnedKeysConfig = { pinnedKeys: [], mimeType: '', encrypt: false, sign: false, scheme: '' };
    try {
        const contacts = (await api(queryContactEmails({ Email } as any))) as ContactEmail[];
        if (!contacts.length) {
            return defaultConfig;
        }
        // pick the first contact with the desired email. The API returns them ordered by decreasing priority already
        const { Contact } = await api(getContact(contacts[0].ContactID));
        // all the info we need is in the signed part
        const signedCard = Contact.Cards.find(({ Type }: { Type: number }) => Type === CONTACT_CARD_TYPE.SIGNED);
        const properties = parse(signedCard);
        const emailProperty = properties.find(({ field, value }) => field === 'email' && value === Email);
        if (!emailProperty || !emailProperty.group) {
            throw new Error(c('Error').t`Invalid vcard`);
        }
        return getKeyInfoFromProperties(properties, emailProperty.group);
    } catch (error) {
        return { pinnedKeys: [], mimeType: '', encrypt: false, sign: false, scheme: '', error };
    }
};
