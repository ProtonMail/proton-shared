import { Message } from '../interfaces/mail/message';
import { isSign } from './messages';
import { EncryptionPreferences } from './encryptionPreferences';
import { getMimeType, getPGPScheme, SendPreferences } from './sendPreferences';

export interface MapSendPreferences {
    [email: string]: SendPreferences;
}

/**
 * The goal of this service is to provide all the encryption + encoding preferences for a recipient by parsing the
 * contact of the recipient, considering the general settings, inputs from the message that we want to send and API stuff
 *
 * For the general logic see:
 * https://docs.google.com/document/d/1lEBkG0DC5FOWlumInKtu4a9Cc1Eszp48ZhFy9UpPQso
 * This is the specification it should implement and should be the right way to do this
 *
 * primaryPinned basically just says if the primary key is available for sending (so either pinned or key pinning is disabled
 * It differs from pinned as pinned just says is key pinning is enabled.
 * primaryPinned is a flag that tells the FE that we first need to fix the sendPreference before sending.
 */
const getSendPreferences = async (
    encryptionPreferences: EncryptionPreferences,
    message: Message
): Promise<SendPreferences> => {
    const { encrypt, sign, publicKey, isPublicKeyPinned, hasApiKeys, hasPinnedKeys, warnings } = encryptionPreferences;
    // TODO if is ownAddress
    // TODO error and warnings
    // override sign if necessary
    // (i.e. when the contact sign preference is false and the user toggles "Sign" on the composer)
    const newSign = sign || isSign(message);
    // cast PGP scheme into what API expects. Override if necessary
    const pgpScheme = getPGPScheme(encryptionPreferences, message);
    // use message MIME type if no MIME type has been specified
    const newMimeType = getMimeType(encryptionPreferences, message);

    return {
        encrypt,
        sign: newSign,
        pgpScheme,
        mimetype: newMimeType,
        publickeys: [publicKey],
        isPublicKeyPinned,
        hasApiKeys,
        hasPinnedKeys,
        warnings
    };
};

export default getSendPreferences;
