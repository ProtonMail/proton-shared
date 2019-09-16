import { encryptMessage, decryptMessageLegacy } from 'pmcrypto';
// import { fromUnixTime } from 'date-fns';

import { LABEL_LEGACY_MESSAGE, QUERY_LEGACY_MESSAGES_MAX_PAGESIZE } from '../constants';
import { chunk } from '../helpers/array';
import { wait } from '../helpers/promise';
import { noop } from '../helpers/function';

const fromUnixTime = ({ Time = 0 } = {}) => new Date(Time * 1000);

const LEGACY_MESSAGES_CHUNK_SIZE = 5; // how many messages we want to decrypt and encrypt simultaneously

/**
 * Given a list of legacy message IDs, fetch, decrypt, re-encrypt and send them to API
 * @param {Array<String>} messageIDs
 * @param {Function} obj.getMessage
 * @param {Function} obj.updateMessage
 * @param {Function} obj.getPrivateKeys
 * @param {Function} obj.getPublicKey
 */
const clearSome = async (
    messageIDs = [],
    { signal, getMessage, updateMessage, getPrivateKeys, getPublicKey, onError = noop }
) => {
    if (!messageIDs.length) {
        return;
    }

    return Promise.all(
        messageIDs.map(async (ID) => {
            try {
                if (signal.aborted) {
                    return;
                }
                // Get message and private keys
                const { data: message = {} } = await getMessage(ID);
                const { Time, Body, AddressID } = message;
                const privateKeys = getPrivateKeys(AddressID);

                if (signal.aborted) {
                    return;
                }
                // Decrypt message
                const { data } = await decryptMessageLegacy({
                    message: Body,
                    messageDate: fromUnixTime(Time),
                    privateKeys
                });

                if (signal.aborted) {
                    return;
                }
                // Re-encrypt message body. Use the primary key (first in the array) for re-encryption
                const publicKeys = [getPublicKey(privateKeys[0])];
                const { data: newBody } = await encryptMessage({
                    data,
                    publicKeys,
                    format: 'utf8',
                    compression: true
                });

                if (signal.aborted) {
                    return;
                }
                // Send re-encrypted message to API
                return await updateMessage({ ID, Body: newBody });
            } catch (e) {
                // Do nothing upon error
                onError(e);
            }
        })
    );
};

/**
 * Fetch legacy messages, re-encrypt and send them to API
 */
export const clearAll = async ({
    signal,
    queryMessages,
    getMessage,
    updateMessage,
    getPrivateKeys,
    getPublicKey,
    onError
}) => {
    const RELAX_TIME = 5 * 1000; // 5s

    if (signal.aborted) {
        return;
    }
    const { data = {} } = await queryMessages({
        LabelID: [LABEL_LEGACY_MESSAGE],
        Page: 0,
        PageSize: QUERY_LEGACY_MESSAGES_MAX_PAGESIZE
    });
    const { Total, Messages = [] } = data;

    if (Total === 0) {
        return;
    }

    // proceed in chunk of 10 messages, not to burn user's machine
    const messageIDs = chunk(Messages.map(({ ID }) => ID), LEGACY_MESSAGES_CHUNK_SIZE);
    for (let i = 0; i < messageIDs.length; i++) {
        await clearSome(messageIDs[i], { getMessage, updateMessage, getPrivateKeys, getPublicKey, onError, signal });
        !signal.aborted && (await wait(RELAX_TIME));
    }

    return clearAll(); // updateMessage removes legacy label, so no need of updating the Page
};
