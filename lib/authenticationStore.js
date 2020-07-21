import { encodeUtf8Base64, decodeUtf8Base64 } from 'pmcrypto';

import { MAILBOX_PASSWORD_KEY, UID_KEY, LOCAL_ID_KEY } from './constants';

export default ({ set, get }) => {
    const setUID = (UID) => set(UID_KEY, UID);
    const getUID = () => get(UID_KEY);

    const setPassword = (password) => set(MAILBOX_PASSWORD_KEY, encodeUtf8Base64(password));
    const getPassword = () => {
        const value = get(MAILBOX_PASSWORD_KEY);
        return value ? decodeUtf8Base64(value) : undefined;
    };

    const setLocalID = (LocalID) => set(LOCAL_ID_KEY, LocalID);
    const getLocalID = () => get(LOCAL_ID_KEY);

    const hasSession = () => !!getUID();

    return {
        getUID,
        setUID,
        setLocalID,
        getLocalID,
        hasSession,
        setPassword,
        getPassword,
    };
};
