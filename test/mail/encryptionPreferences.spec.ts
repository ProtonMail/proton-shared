import { OpenPGPKey } from 'pmcrypto';
import { DRAFT_MIME_TYPES, PGP_SCHEMES } from '../../lib/constants';
import extractEncryptionPreferences, { EncryptionPreferencesFailure } from '../../lib/mail/encryptionPreferences';

const fakeKey1 = {
    getFingerprint() {
        return 'fakeKey1';
    },
    users: [
        {
            userId: {
                userid: '<user1@pm.me>'
            }
        }
    ]
};
const pinnedFakeKey1 = {
    getFingerprint() {
        return 'fakeKey1';
    },
    users: [
        {
            userId: {
                userid: '<user1@pm.me>'
            }
        }
    ]
};
const fakeKey2 = {
    getFingerprint() {
        return 'fakeKey2';
    },
    users: [
        {
            userId: {
                userid: '<user2@pm.me>'
            }
        }
    ]
};
const pinnedFakeKey2 = {
    getFingerprint() {
        return 'fakeKey2';
    },
    users: [
        {
            userId: {
                userid: '<user2@pm.me>'
            }
        }
    ]
};
const fakeKey3 = {
    getFingerprint() {
        return 'fakeKey3';
    },
    users: [
        {
            userId: {
                userid: '<user3@pm.me>'
            }
        }
    ]
};
const pinnedFakeKey3 = {
    getFingerprint() {
        return 'fakeKey2';
    },
    users: [
        {
            userId: {
                userid: '<user3@pm.me>'
            }
        }
    ]
};

describe('extractEncryptionPreferences', () => {
    it('should extract the pinned key (and not the API one) for an internal user with pinned keys', () => {
        const publicKeyModel = {
            emailAddress: 'user@pm.me',
            publicKeys: { api: [fakeKey1, fakeKey2, fakeKey3], pinned: [pinnedFakeKey1, pinnedFakeKey2] },
            encrypt: true,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.DEFAULT,
            scheme: PGP_SCHEMES.PGP_MIME,
            trustedFingerprints: new Set([pinnedFakeKey1]),
            expiredFingerprints: new Set(),
            revokedFingerprints: new Set(),
            verifyOnlyFingerprints: new Set(),
            isPGPExternal: false,
            isPGPInternal: true,
            isPGPExternalWithWKDKeys: false,
            isPGPExternalWithoutWKDKeys: false,
            pgpAddressDisabled: false
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.DEFAULT,
            scheme: PGP_SCHEMES.PGP_MIME,
            publicKey: pinnedFakeKey1,
            isPublicKeyPinned: true,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: true,
            warnings: []
        });
    });

    it('should extract the pinned key (and not the API one) for an internal user with pinned keys', () => {
        const publicKeyModel = {
            emailAddress: 'user@pm.me',
            publicKeys: { api: [fakeKey1, fakeKey2, fakeKey3], pinned: [pinnedFakeKey1, pinnedFakeKey2] },
            encrypt: true,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.DEFAULT,
            scheme: PGP_SCHEMES.PGP_MIME,
            trustedFingerprints: new Set([pinnedFakeKey1]),
            expiredFingerprints: new Set(),
            revokedFingerprints: new Set(),
            verifyOnlyFingerprints: new Set(),
            isPGPExternal: false,
            isPGPInternal: true,
            isPGPExternalWithWKDKeys: false,
            isPGPExternalWithoutWKDKeys: false,
            pgpAddressDisabled: false
        };
        const result = extractEncryptionPreferences(publicKeyModel);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: DRAFT_MIME_TYPES.DEFAULT,
            scheme: PGP_SCHEMES.PGP_MIME,
            publicKey: pinnedFakeKey1,
            isPublicKeyPinned: true,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: true,
            warnings: []
        });
    });
});
