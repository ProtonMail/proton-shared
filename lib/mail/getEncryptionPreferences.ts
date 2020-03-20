import { getPublicKeysEmailHelper, getPublicKeysVcardHelper } from '../api/helpers/publicKeys';
import { getPublicKeyModel } from '../keys/publicKeys';
import extractEncryptionPreferences, { EncryptionPreferences } from './encryptionPreferences';
import { Api, ApiMailSettings } from '../interfaces';

// Implement the logic in the document 'Encryption preferences for outgoing email'

interface ContactSendInfo {
    emailAddress: string;
    mailSettings: ApiMailSettings;
    api: Api;
}

const getEncryptionPreferences = async ({
    emailAddress,
    mailSettings,
    api
}: ContactSendInfo): Promise<Partial<EncryptionPreferences>> => {
    const apiKeysConfig = await getPublicKeysEmailHelper(api, emailAddress);
    const pinnedKeysConfig = await getPublicKeysVcardHelper(api, emailAddress);
    const keyModel = await getPublicKeyModel({ email: emailAddress, apiKeysConfig, pinnedKeysConfig, mailSettings });

    return extractEncryptionPreferences(keyModel);
};

export default getEncryptionPreferences;
