import { AddressKey, SignedKeyList } from '../interfaces';

export const getPublicKeys = ({ Email, Fingerprint }: { Email: string; Fingerprint: string }) => ({
    url: 'keys',
    method: 'get',
    params: { Email, Fingerprint }
});

export const getKeySalts = () => ({
    url: 'keys/salts',
    method: 'get'
});

/**
 * Create a key.
 * @param {String} AddressID
 * @param {String} PrivateKey
 * @param {Number} Primary
 * @param {Object} SignedKeyList
 * @return {Object}
 */
export const createAddressKeyRoute = ({
    AddressID,
    Primary,
    PrivateKey,
    SignedKeyList
}: {
    AddressID: string;
    Primary: number;
    PrivateKey: string;
    SignedKeyList: SignedKeyList;
}) => ({
    url: 'keys',
    method: 'post',
    data: {
        AddressID,
        PrivateKey,
        Primary,
        SignedKeyList
    }
});

/**
 * Reactivate a key.
 * @param {String} ID
 * @param {String} PrivateKey
 * @param {Object} [SignedKeyList] - If activating an address key
 * @return {Object}
 */
export const reactivateKeyRoute = ({
    ID,
    PrivateKey,
    SignedKeyList
}: {
    ID: string;
    PrivateKey: string;
    SignedKeyList: SignedKeyList | undefined;
}) => ({
    url: `keys/${ID}`,
    method: 'put',
    data: {
        PrivateKey,
        SignedKeyList
    }
});

/**
 * Set key as primary.
 * @param {String} ID
 * @param {Object} SignedKeyList
 * @return {Object}
 */
export const setKeyPrimaryRoute = ({ ID, SignedKeyList }: { ID: string; SignedKeyList: SignedKeyList }) => ({
    url: `keys/${ID}/primary`,
    method: 'put',
    data: {
        SignedKeyList
    }
});

/**
 * Set key flags.
 * @param {String} ID
 * @param {Number} Flags
 * @param {Object} SignedKeyList
 * @return {Object}
 */
export const setKeyFlagsRoute = ({
    ID,
    Flags,
    SignedKeyList
}: {
    ID: string;
    Flags: number;
    SignedKeyList: SignedKeyList;
}) => ({
    url: `keys/${ID}/flags`,
    method: 'put',
    data: {
        Flags,
        SignedKeyList
    }
});

/**
 * Set key flags.
 * @param {String} ID
 * @param {Object} SignedKeyList
 * @return {Object}
 */
export const removeKeyRoute = ({ ID, SignedKeyList }: { ID: string; SignedKeyList: SignedKeyList }) => ({
    url: `keys/${ID}/delete`,
    method: 'put',
    data: {
        SignedKeyList
    }
});

export const updatePrivateKeyRoute = ({
    KeySalt,
    Keys,
    OrganizationKey
}: {
    KeySalt: string;
    Keys: any[];
    OrganizationKey: string;
}) => ({
    url: 'keys/private',
    method: 'put',
    data: {
        KeySalt,
        Keys,
        OrganizationKey
    }
});

export const resetKeysRoute = ({
    Username,
    PrimaryKey,
    Token,
    KeySalt,
    AddressKeys
}: {
    Username: string;
    PrimaryKey: string;
    Token: string;
    KeySalt: string;
    AddressKeys: AddressKey[];
}) => ({
    url: 'keys/reset',
    method: 'post',
    data: {
        Username,
        PrimaryKey,
        Token,
        KeySalt,
        AddressKeys
    }
});
