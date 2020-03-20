import { OpenPGPKey } from 'pmcrypto';
import { DRAFT_MIME_TYPES, PGP_SCHEMES, RECIPIENT_TYPES } from '../constants';
import { ApiMailSettings } from './MailSettings';

export interface Key {
    ID: string;
    Primary: number;
    Flags: number;
    Fingerprint: string;
    Fingerprints: string[];
    PublicKey: string; // armored key
    Version: number;
    Activation?: string;
    PrivateKey: string; // armored key
    Token?: string;
    Signature: string;
}

export interface KeyPair {
    privateKey: OpenPGPKey;
    publicKey: OpenPGPKey;
}

export interface KeyPairs {
    privateKeys: OpenPGPKey[];
    publicKeys: OpenPGPKey[];
}

export type MimeTypeVcard = DRAFT_MIME_TYPES.PLAINTEXT;

export interface PublicKeyData {
    Code?: number;
    RecipientType?: RECIPIENT_TYPES;
    MIMEType?: MimeTypeVcard;
    Keys: Key[];
    SignedKeyList?: any[];
    Warnings?: string[];
}

export interface ApiKeysConfig extends PublicKeyData {
    publicKeys: OpenPGPKey[];
    isVerificationOnly: { [key: string]: boolean };
}

export interface PinnedKeysConfig {
    pinnedKeys: OpenPGPKey[];
    encrypt?: boolean;
    sign?: boolean;
    mimeType?: MimeTypeVcard;
    scheme?: PGP_SCHEMES;
    error?: Error;
}

export interface PublicKeyConfigs {
    email: string;
    apiKeysConfig: ApiKeysConfig;
    pinnedKeysConfig: PinnedKeysConfig;
    mailSettings: ApiMailSettings;
}

export interface PublicKeyModel {
    email: string;
    publicKeys: { api: OpenPGPKey[]; pinned: OpenPGPKey[] };
    encrypt: boolean;
    sign: boolean;
    mimeType: DRAFT_MIME_TYPES;
    scheme: PGP_SCHEMES;
    trustedFingerprints: Set<string>;
    expiredFingerprints: Set<string>;
    revokedFingerprints: Set<string>;
    verifyOnlyFingerprints: Set<string>;
    isPGPExternal: boolean;
    isPGPInternal: boolean;
    isPGPExternalWithWKDKeys: boolean;
    isPGPExternalWithoutWKDKeys: boolean;
    pgpAddressDisabled: boolean;
}
