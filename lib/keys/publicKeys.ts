import { OpenPGPKey, serverTime } from 'pmcrypto';
import { c } from 'ttag';
import { KEY_FLAG, MIME_TYPES_MORE, PGP_SCHEMES_MORE, RECIPIENT_TYPES } from '../constants';
import { canonizeEmailByGuess, canonizeInternalEmail } from '../helpers/email';
import isTruthy from '../helpers/isTruthy';
import { toBitMap } from '../helpers/object';
import { ApiKeysConfig, ContactPublicKeyModel, PublicKeyConfigs, PublicKeyModel } from '../interfaces';
import { hasBit } from '../helpers/bitset';

const { TYPE_INTERNAL } = RECIPIENT_TYPES;

/**
 * Check if some API key data belongs to an internal user
 */
export const getIsInternalUser = ({ RecipientType }: ApiKeysConfig): boolean => RecipientType === TYPE_INTERNAL;

/**
 * Test if no key is enabled
 */
export const isDisabledUser = (config: ApiKeysConfig): boolean =>
    getIsInternalUser(config) && !config.Keys.some(({ Flags }) => hasBit(Flags, KEY_FLAG.FLAG_NOT_OBSOLETE));

export const getEmailMismatchWarning = (publicKey: OpenPGPKey, emailAddress: string, isInternal: boolean): string[] => {
    const canonicalEmail = isInternal ? canonizeInternalEmail(emailAddress) : canonizeEmailByGuess(emailAddress);
    const users = publicKey.users || [];
    const keyEmails = users.reduce<string[]>((acc, { userId = {} } = {}) => {
        if (!userId?.userid) {
            // userId can be set to null
            return acc;
        }
        const [, email = userId.userid] = /<([^>]*)>/.exec(userId.userid) || [];
        // normalize the email
        acc.push(email);
        return acc;
    }, []);
    const canonicalKeyEmails = keyEmails.map((email) =>
        isInternal ? canonizeInternalEmail(email) : canonizeEmailByGuess(email)
    );
    if (!canonicalKeyEmails.includes(canonicalEmail)) {
        const keyUserIds = keyEmails.join(', ');
        return [c('PGP key warning').t`Email address not found among user ids defined in sending key (${keyUserIds})`];
    }
    return [];
};

/**
 * Sort list of keys retrieved from the API. Trusted keys take preference.
 * For two keys such that both are either trusted or not, non-verify-only keys take preference
 */
export const sortApiKeys = (
    keys: OpenPGPKey[] = [],
    trustedFingerprints: Set<string>,
    verifyOnlyFingerprints: Set<string>
): OpenPGPKey[] =>
    keys
        .reduce<OpenPGPKey[][]>(
            (acc, key) => {
                const fingerprint = key.getFingerprint();
                // calculate order through a bitmap
                const index = toBitMap({
                    isVerificationOnly: verifyOnlyFingerprints.has(fingerprint),
                    isNotTrusted: !trustedFingerprints.has(fingerprint),
                });
                acc[index].push(key);
                return acc;
            },
            Array.from({ length: 4 }).map(() => [])
        )
        .flat();

/**
 * Sort list of pinned keys retrieved from the API. Keys that can be used for sending take preference
 */
export const sortPinnedKeys = (
    keys: OpenPGPKey[] = [],
    expiredFingerprints: Set<string>,
    revokedFingerprints: Set<string>
): OpenPGPKey[] =>
    keys
        .reduce<OpenPGPKey[][]>(
            (acc, key) => {
                const fingerprint = key.getFingerprint();
                // calculate order through a bitmap
                const index = toBitMap({
                    cannotSend: expiredFingerprints.has(fingerprint) || revokedFingerprints.has(fingerprint),
                });
                acc[index].push(key);
                return acc;
            },
            Array.from({ length: 2 }).map(() => [])
        )
        .flat();

/**
 * Given a public key, return its expiration and revoke status
 */
export const getKeyEncryptStatus = async (
    publicKey: OpenPGPKey,
    timestamp?: number
): Promise<{
    isExpired: boolean;
    isRevoked: boolean;
}> => {
    const now = timestamp || +serverTime();
    const creationTime = +publicKey.getCreationTime();
    // notice there are different expiration times depending on the use of the key.
    const expirationTime = await publicKey.getExpirationTime('encrypt');
    const isExpired = !(creationTime <= now && now <= expirationTime);

    // TODO: OpenPGP types not up-to-date, remove assertions when fixed
    const isRevoked = (await publicKey.isRevoked(null as any, null as any, timestamp as any)) as boolean;
    return { isExpired, isRevoked };
};

/**
 * Given a public key retrieved from the API, return true if it has been marked by the API as
 * verification-only. Return false if it's marked valid for encryption. Return undefined otherwise
 */
export const getKeyVerificationOnlyStatus = (publicKey: OpenPGPKey, config: ApiKeysConfig): boolean | undefined => {
    const fingerprint = publicKey.getFingerprint();
    const index = config.publicKeys.findIndex((publicKey) => publicKey?.getFingerprint() === fingerprint);
    if (index === -1) {
        return undefined;
    }
    return !hasBit(config.Keys[index].Flags, KEY_FLAG.FLAG_NOT_OBSOLETE);
};

/**
 * Check if a public key is valid for sending according to the information stored in a public key model
 * We rely only on the fingerprint of the key to do this check
 */
export const getIsValidForSending = (
    fingerprint: string,
    publicKeyModel: PublicKeyModel | ContactPublicKeyModel
): boolean => {
    const { verifyOnlyFingerprints, revokedFingerprints, expiredFingerprints } = publicKeyModel;
    return (
        !verifyOnlyFingerprints.has(fingerprint) &&
        !revokedFingerprints.has(fingerprint) &&
        !expiredFingerprints.has(fingerprint)
    );
};

/**
 * For a given email address and its corresponding public keys (retrieved from the API and/or the corresponding vCard),
 * construct the contact public key model, which reflects the content of the vCard.
 */
export const getContactPublicKeyModel = async ({
    emailAddress,
    apiKeysConfig,
    pinnedKeysConfig,
}: Omit<PublicKeyConfigs, 'mailSettings'>): Promise<ContactPublicKeyModel> => {
    const {
        pinnedKeys = [],
        encrypt,
        sign,
        scheme: vcardScheme,
        mimeType: vcardMimeType,
        isContact,
        isContactSignatureVerified,
    } = pinnedKeysConfig;
    const trustedFingerprints = new Set<string>();
    const expiredFingerprints = new Set<string>();
    const revokedFingerprints = new Set<string>();

    // prepare keys retrieved from the vCard
    await Promise.all(
        pinnedKeys.map(async (publicKey) => {
            const fingerprint = publicKey.getFingerprint();
            const { isExpired, isRevoked } = await getKeyEncryptStatus(publicKey);
            trustedFingerprints.add(fingerprint);
            if (isExpired) {
                expiredFingerprints.add(fingerprint);
            }
            if (isRevoked) {
                revokedFingerprints.add(fingerprint);
            }
        })
    );
    const orderedPinnedKeys = sortPinnedKeys(pinnedKeys, expiredFingerprints, revokedFingerprints);

    // prepare keys retrieved from the API
    const isInternalUser = getIsInternalUser(apiKeysConfig);
    const isExternalUser = !isInternalUser;
    const verifyOnlyFingerprints = new Set<string>();
    const apiKeys = apiKeysConfig.publicKeys.filter(isTruthy);
    apiKeys.forEach((publicKey) => {
        if (getKeyVerificationOnlyStatus(publicKey, apiKeysConfig)) {
            verifyOnlyFingerprints.add(publicKey.getFingerprint());
        }
    });
    const orderedApiKeys = sortApiKeys(apiKeys, trustedFingerprints, verifyOnlyFingerprints);

    return {
        encrypt,
        sign,
        scheme: vcardScheme || PGP_SCHEMES_MORE.GLOBAL_DEFAULT,
        mimeType: vcardMimeType || MIME_TYPES_MORE.AUTOMATIC,
        emailAddress,
        publicKeys: { apiKeys: orderedApiKeys, pinnedKeys: orderedPinnedKeys },
        trustedFingerprints,
        expiredFingerprints,
        revokedFingerprints,
        verifyOnlyFingerprints,
        isPGPExternal: isExternalUser,
        isPGPInternal: isInternalUser,
        isPGPExternalWithWKDKeys: isExternalUser && !!apiKeys.length,
        isPGPExternalWithoutWKDKeys: isExternalUser && !apiKeys.length,
        pgpAddressDisabled: isDisabledUser(apiKeysConfig),
        isContact,
        isContactSignatureVerified,
        emailAddressWarnings: apiKeysConfig.Warnings,
        emailAddressErrors: apiKeysConfig.Errors,
    };
};
