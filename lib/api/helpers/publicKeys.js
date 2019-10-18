import { API_CUSTOM_ERROR_CODES } from '../../errors';
import { getPublicKeys } from '../keys';

const { KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID } = API_CUSTOM_ERROR_CODES;
const EMAIL_ERRORS = [KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID];

export const getPublicKeysEmailHelper = async (api, Email) => {
    try {
        // eslint-disable-next-line no-unused-vars
        return await api(getPublicKeys({ Email }));
    } catch (error) {
        const { data = {} } = error;
        if (EMAIL_ERRORS.includes(data.Code)) {
            return { Keys: [] };
        }
        throw error;
    }
};
