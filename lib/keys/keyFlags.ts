import { KEY_FLAG } from '../constants';
import { Address, CachedKey, Key } from '../interfaces';

export const getDefaultKeyFlagsAddress = ({ Receive }: Address, addressKeysList: Key[] | CachedKey[]) => {
    // If there were keys, and the address can not receive, the key can also not receive
    return !Receive && addressKeysList.length > 0 ? KEY_FLAG.VERIFY : KEY_FLAG.ENCRYPT + KEY_FLAG.VERIFY;
};

export const getDefaultKeyFlagsUser = () => KEY_FLAG.ENCRYPT + KEY_FLAG.VERIFY;
