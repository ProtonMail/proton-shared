import getPublicKeysVcardHelper from '../api/helpers/getPublicKeysVcardHelper';
import getPublicKeysEmailHelper from '../api/helpers/getPublicKeysEmailHelper';
import { getPublicKeyModel } from '../keys/publicKeys';
import extractEncryptionPreferences, { EncryptionPreferences } from './encryptionPreferences';
import { Address, Api, MailSettings } from '../interfaces';

interface ContactSendInfo {
    emailAddress: string;
    mailSettings: MailSettings;
    api: Api;
    addresses: Address[];
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
    addresses
}: ContactSendInfo): Promise<EncryptionPreferences> => {
    const apiKeysConfig = await getPublicKeysEmailHelper(api, emailAddress);
    const pinnedKeysConfig = addresses.some(({ Email }) => Email === emailAddress)
        ? { pinnedKeys: [] } // do not fetch vCard key data for own addresses
        : await getPublicKeysVcardHelper(api, emailAddress);
    const keyModel = await getPublicKeyModel({ email: emailAddress, apiKeysConfig, pinnedKeysConfig, mailSettings });

    return extractEncryptionPreferences(keyModel, addresses);
};

export default getEncryptionPreferences;
