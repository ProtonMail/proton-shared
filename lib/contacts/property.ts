import { arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64, getKeys, OpenPGPKey } from 'pmcrypto';
import { DRAFT_MIME_TYPES, PGP_SCHEMES } from '../constants';
import { noop } from '../helpers/function';
import { MimeTypeVcard, PinnedKeysConfig, PublicKeyWithPref } from '../interfaces';
import { ContactProperties, ContactProperty } from '../interfaces/contacts/Contact';
import { VCARD_KEY_FIELDS } from './constants';
import { sortByPref } from './properties';

/**
 * ICAL library can crash if the value saved in the vCard is improperly formatted
 * If it crash we get the raw value from jCal key
 * @param {ICAL.Property} property
 */
const getRawValues = (property: any): string[] => {
    try {
        return property.getValues();
    } catch (error) {
        const [, , , value = ''] = property.jCal || [];
        return [value];
    }
};

/**
 * Get the value of an ICAL property
 * @param {ICAL.Property} property
 *
 * @return {String,Array}  currently an array for the field adr, a string otherwise
 */
export const getValue = (property: any): string | string[] => {
    const [value] = getRawValues(property).map((val: string | string[] | Date) => {
        // adr
        if (Array.isArray(val)) {
            return val;
        }

        if (typeof val === 'string') {
            return val;
        }

        // date
        return val.toString();
    });

    return value;
};

/**
 * Returns true if a property has an empty value
 */
export const isEmptyValued = (property: ContactProperty): boolean => {
    const { value } = property;
    // property values must be strings or arrays of strings
    if (typeof value === 'string') {
        return !value;
    }
    if (Array.isArray(value)) {
        return !value.some((str) => str);
    }
    return true;
};

/**
 * Transform a custom type starting with 'x-' into normal type
 */
export const clearType = (type: string = ''): string => type.toLowerCase().replace('x-', '');

/**
 * Given types in an array, return the first type. If types is a string already, return it
 */
export const getType = (types: string | string[] = []): string => {
    if (Array.isArray(types)) {
        if (!types.length) {
            return '';
        }
        return types[0];
    }
    return types;
};

/**
 * Transform an array value for the field 'adr' into a string to be displayed
 */
export const formatAdr = (adr: string[] = []): string => {
    return adr
        .filter(Boolean)
        .map((value) => value.trim())
        .join(', ');
};

/**
 * The only values allowed for a PGP scheme stored in a vCard are
 * '' for default PGP scheme (meaning we should use the PGPScheme from mailSettings when composing email)
 * 'pgp-mime' for PGP-Inline scheme
 * 'pgp-mime' for PGP-MIME scheme
 */
const getPGPSchemeVcard = (scheme: string): PGP_SCHEMES | undefined => {
    // ugly code; typescript to be blamed
    if (Object.values(PGP_SCHEMES).includes(scheme as PGP_SCHEMES)) {
        return scheme as PGP_SCHEMES;
    }
    return undefined;
};

/**
 * The only values allowed for a MIME type stored in a vCard are
 * '' for automatic format (meaning we should use DraftMIMEType from mailSettings when composing email)
 * 'text/plain' for plain text format
 */
const getMimeTypeVcard = (mimeType: string): MimeTypeVcard | undefined => {
    return mimeType === DRAFT_MIME_TYPES.PLAINTEXT ? mimeType : undefined;
};

/**
 * Given an array of vCard properties, extract the keys and key-related fields relevant for an email address
 */
export const getKeyInfoFromProperties = async (
    properties: ContactProperties,
    emailGroup: string
): Promise<PinnedKeysConfig> => {
    const { pinnedKeyPromises, mimeType, encrypt, scheme, sign } = properties
        .filter(({ field, group }) => VCARD_KEY_FIELDS.includes(field) && group === emailGroup)
        .reduce<{
            pinnedKeyPromises: Promise<PublicKeyWithPref | undefined>[];
            encrypt?: boolean;
            sign?: boolean;
            scheme?: PGP_SCHEMES;
            mimeType?: MimeTypeVcard;
        }>(
            (acc, { field, value, pref }) => {
                if (field === 'key' && value) {
                    const [, base64 = ''] = (value as string).split(',');
                    const key = binaryStringToArray(decodeBase64(base64));

                    if (key.length) {
                        const promise = getKeys(key)
                            .then(([publicKey]) => ({ publicKey, pref }))
                            .catch(noop);
                        acc.pinnedKeyPromises.push(promise);
                    }

                    return acc;
                }
                if (field === 'x-pm-encrypt' && value) {
                    acc.encrypt = value === 'true';
                    return acc;
                }
                if (field === 'x-pm-sign' && value) {
                    acc.sign = value === 'true';
                    return acc;
                }
                if (field === 'x-pm-scheme' && value) {
                    acc.scheme = getPGPSchemeVcard(value as string);
                    return acc;
                }
                if (field === 'x-pm-mimetype' && value) {
                    acc.mimeType = getMimeTypeVcard(value as string);
                    return acc;
                }
                return acc;
            },
            {
                // Default values
                pinnedKeyPromises: [],
                encrypt: undefined,
                sign: undefined,
                scheme: undefined,
                mimeType: undefined
            }
        );
    const rawPinnedKeys = (await Promise.all(pinnedKeyPromises)).filter(Boolean) as PublicKeyWithPref[];
    const pinnedKeys = rawPinnedKeys.sort(sortByPref).map(({ publicKey }) => publicKey);

    return { pinnedKeys, encrypt, scheme, mimeType, sign };
};

interface VcardPublicKey {
    publicKey: OpenPGPKey;
    group: string;
    index: number;
}
/**
 * Transform a key into a vCard property
 * @param {} publicKey      A PGP key
 * @param {String} group
 * @param {Number} index
 * @returns { field, pref, value, group }
 */
export const toKeyProperty = ({ publicKey, group, index }: VcardPublicKey): Partial<ContactProperty> => ({
    field: 'key',
    value: `data:application/pgp-keys;base64,${encodeBase64(
        arrayToBinaryString(publicKey.toPacketlist().write() as Uint8Array)
    )}`,
    group,
    pref: index + 1 // order is important
});
