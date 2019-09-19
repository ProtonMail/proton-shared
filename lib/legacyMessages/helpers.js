import { encryptMessage, decryptMessageLegacy } from 'pmcrypto';
// import { fromUnixTime } from 'date-fns';

import { LABEL_LEGACY_MESSAGE, QUERY_LEGACY_MESSAGES_MAX_PAGESIZE, UPDATE_MESSAGE_SUCESS_CODE } from '../constants';
import { chunk } from '../helpers/array';
import { wait } from '../helpers/promise';
import { noop } from '../helpers/function';

const fromUnixTime = (Time = 0) => new Date(Time * 1000);

const LEGACY_MESSAGES_CHUNK_SIZE = 5; // how many messages we want to decrypt and encrypt simultaneously

/**
 * Given a list of legacy message IDs, fetch, decrypt, re-encrypt and send them to API
 * @param {Array<String>} messageIDs        List of IDs of legacy messages
 * @param {AbortController.signal} signal   { aborted: true/false }
 * @param {Function} obj.getMessage
 * @param {Function} obj.updateBody
 * @param {Function} obj.getPrivateKeys
 * @param {Function} obj.onError
 */
const clearSome = async (messageIDs = [], { signal, getMessage, updateBody, getPrivateKeys, onError = noop }) => {
    if (!messageIDs.length) {
        return;
    }

    let noneMigratedInBatch = true;
    await Promise.all(
        messageIDs.map(async (ID) => {
            try {
                if (signal.aborted) {
                    return;
                }

                // Get message and private keys
                const {
                    data: { Message: message = {} }
                } = await getMessage(ID);
                const { Time, Body, AddressID } = message;
                const privateKeys = await getPrivateKeys(AddressID);

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
                const publicKeys = [privateKeys[0].toPublic()];
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
                const { Code } = await updateBody({ ID, Body: newBody });
                if (Code === UPDATE_MESSAGE_SUCESS_CODE) {
                    noneMigratedInBatch = false;
                }
                return;
            } catch (e) {
                e.message = `Error migrating legacy message with messageID ${ID}. ${e.message}`;
                onError(e);
            }
        })
    );

    return { noneMigratedInBatch };
};

/**
 * Fetch legacy messages, re-encrypt and send them to API
 */
export const clearAll = async ({
    signal,
    page = 0,
    queryMessages,
    getMessage,
    updateBody,
    getPrivateKeys,
    onError
}) => {
    const RELAX_TIME = 5 * 1000; // 5s

    if (signal.aborted) {
        return;
    }

    const { data = {} } = await queryMessages({
        LabelID: [LABEL_LEGACY_MESSAGE],
        Page: page,
        PageSize: QUERY_LEGACY_MESSAGES_MAX_PAGESIZE
    });
    const { Messages = [] } = data;

    if (!Messages.length) {
        return;
    }

    // proceed in batches of messages, not to burn user's machine decrypting and re-encrypting
    const messageIDs = chunk(Messages.map(({ ID }) => ID), LEGACY_MESSAGES_CHUNK_SIZE);
    let noneMigrated = true;
    for (let i = 0; i < messageIDs.length; i++) {
        const { noneMigratedInBatch } = await clearSome(messageIDs[i], {
            signal,
            getMessage,
            updateBody,
            getPrivateKeys,
            onError
        });
        noneMigrated = noneMigrated && noneMigratedInBatch;
        !signal.aborted && (await wait(RELAX_TIME));
    }

    // updateBody removes legacy label only if update successful
    // change page accordingly
    return clearAll({
        signal,
        page: page + noneMigrated,
        queryMessages,
        getMessage,
        updateBody,
        getPrivateKeys,
        onError
    });
};
