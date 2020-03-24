import { getPublicKeysEmailHelper, getPublicKeysVcardHelper } from '../api/helpers/publicKeys';
import { getPublicKeyModel } from '../keys/publicKeys';
import extractEncryptionPreferences, { EncryptionPreferences } from './encryptionPreferences';
import { Api, MailSettings } from '../interfaces';

interface ContactSendInfo {
    emailAddress: string;
    mailSettings: MailSettings;
    api: Api;
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
    api
}: ContactSendInfo): Promise<EncryptionPreferences> => {
    const apiKeysConfig = await getPublicKeysEmailHelper(api, emailAddress);
    const pinnedKeysConfig = await getPublicKeysVcardHelper(api, emailAddress);
    const keyModel = await getPublicKeyModel({ email: emailAddress, apiKeysConfig, pinnedKeysConfig, mailSettings });

    return extractEncryptionPreferences(keyModel);
};

export default getEncryptionPreferences;
