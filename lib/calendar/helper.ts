import getRandomValues from 'get-random-values';
import { arrayToBinaryString } from 'pmcrypto';
import { encodeBase64URL } from '../helpers/string';

/**
 * Generates a calendar UID of the form 'proton-calendar-uuid'
 */
export const generateUID = () => {
    // by convention we generate 21 bytes of random data
    const randomBytes = getRandomValues(new Uint8Array(21));
    const base64String = encodeBase64URL(arrayToBinaryString(randomBytes));
    // and we encode them in base 64
    return `${base64String}@proton.me`;
};

export const splitProperties = (properties: { [key: string]: any }, splits: { [key: string]: string[] }) => {
    const keys = Object.keys(splits);
    return Object.keys(properties).reduce<{ [key: string]: any }>((acc, propertyName) => {
        keys.forEach((key) => {
            if (splits[key].includes(propertyName)) {
                if (!acc[key]) {
                    acc[key] = {};
                }
                acc[key][propertyName] = properties[propertyName];
            }
        });
        return acc;
    }, {});
};

export const getRestProperties = (properties: { [key: string]: any }, takenKeysMap: Map<string, any>) => {
    const allKeys = Object.keys(properties);
    return allKeys.reduce<{ [key: string]: any }>((acc, key) => {
        if (takenKeysMap.has(key)) {
            return acc;
        }
        acc[key] = properties[key];
        return acc;
    }, {});
};

/**
 * Check whether an object has more keys than a set of keys.
 */
export const hasMoreThan = (set: Set<string>, properties: { [key: string]: any } = {}) => {
    return Object.keys(properties).some((key) => !set.has(key));
};

export const wrap = (res: string) => {
    // Wrap in CRLF according to the rfc
    return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${res}\r\nEND:VCALENDAR`;
};

export const unwrap = (res: string) => {
    if (res.slice(0, 15) !== 'BEGIN:VCALENDAR') {
        return res;
    }
    const startIdx = res.indexOf('BEGIN:', 1);
    if (startIdx === -1 || startIdx === 0) {
        return '';
    }
    const endIdx = res.lastIndexOf('END:VCALENDAR');
    return res.slice(startIdx, endIdx).trim();
};
