import getPublicKeysVcardHelper from '../api/helpers/getPublicKeysVcardHelper';
import getPublicKeysEmailHelper from '../api/helpers/getPublicKeysEmailHelper';
import { getPublicKeyModel } from '../keys/publicKeys';
import extractEncryptionPreferences, { EncryptionPreferences } from './encryptionPreferences';
import { Api, MailSettings, SelfSend } from '../interfaces';

interface Params {
    emailAddress: string;
    mailSettings: MailSettings;
    api: Api;
    selfSend?: SelfSend;
}

// Implement the logic in the document 'Encryption preferences for outgoing email'
/**
 * Given an email address and the user mail settings, return the encryption preferences for sending to that email.
 * The API entry point is also needed. The logic for how those preferences are determined is laid out in the
 * Confluence document 'Encryption preferences for outgoing email'
 */
const getEncryptionPreferences = async ({
    emailAddress,
    mailSettings,
    api,
    selfSend
}: Params): Promise<EncryptionPreferences> => {
    // For own addresses, we use the decrypted keys in selfSend and do not fetch any data from the API
    const apiKeysConfig = selfSend ? { Keys: [], publicKeys: [] } : await getPublicKeysEmailHelper(api, emailAddress);
    const pinnedKeysConfig = selfSend ? { pinnedKeys: [] } : await getPublicKeysVcardHelper(api, emailAddress);
    const publicKeyModel = await getPublicKeyModel({ emailAddress, apiKeysConfig, pinnedKeysConfig, mailSettings });

    return extractEncryptionPreferences(publicKeyModel, selfSend);
};

export default getEncryptionPreferences;
