import { KEY_FLAG } from '../constants';
import { Address } from '../interfaces';

export const getKeyFlagsAddress = ({ Receive }: Address, addressKeysList: any[]) => {
    // If there were keys, and the address can not receive, the key can also not receive
    return !Receive && addressKeysList.length > 0 ? KEY_FLAG.VERIFY : KEY_FLAG.ENCRYPT + KEY_FLAG.VERIFY;
};

export const getKeyFlagsUser = () => KEY_FLAG.ENCRYPT + KEY_FLAG.VERIFY;
