import { DRAFT_MIME_TYPES, PACKAGE_TYPE, PGP_SCHEMES, PGP_SIGN } from '../../constants';
import { ApiMailSettings } from '../../interfaces';

/**
 * Extract sign flag from mail settings
 */
export const extractSign = (mailSettings: ApiMailSettings): boolean => mailSettings.Sign === PGP_SIGN;
/**
 * Extract PGP scheme from mail settings
 */
export const extractScheme = (mailSettings: ApiMailSettings): PGP_SCHEMES => {
    if (mailSettings.PGPScheme === PACKAGE_TYPE.SEND_PGP_INLINE) {
        return PGP_SCHEMES.PGP_INLINE;
    }
    return PGP_SCHEMES.PGP_MIME;
};
/**
 * Extract MIME type (for the composer) from mail settings
 */
export const extractDraftMIMEType = (mailSettings: ApiMailSettings): DRAFT_MIME_TYPES => mailSettings.DraftMIMEType;
