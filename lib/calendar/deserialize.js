import { deserializeUint8Array } from '../helpers/serialization';

import { decryptAndVerifyPart, decryptCard, getDecryptedSessionKey, verifySignedCard } from './decrypt';
import { parse } from './vcal';
import { unwrap } from './helper';
import { toInternalAttendee } from './attendees';

export const readSessionKey = (KeyPacket, privateKeys) => {
    return getDecryptedSessionKey(deserializeUint8Array(KeyPacket), privateKeys);
};

/**
 * Read the session keys.
 * @param {String} SharedKeyPacket
 * @param {String} CalendarKeyPacket
 * @param {Array<PGPKey>|PGPKey} privateKeys - The private keys of the calendar
 * @returns {Promise}
 */
export const readSessionKeys = ({ SharedKeyPacket, CalendarKeyPacket }, privateKeys) => {
    return Promise.all([
        getDecryptedSessionKey(deserializeUint8Array(SharedKeyPacket), privateKeys),
        CalendarKeyPacket ? getDecryptedSessionKey(deserializeUint8Array(CalendarKeyPacket), privateKeys) : undefined
    ]);
};

/**
 * Read the parts of a calendar event into an internal vcal component.
 * @param {Array} [SharedEventContent]
 * @param {Array} [CalendarEventContent]
 * @param {Array} [PersonalEventContent]
 * @param {Array} [AttendeesEvent]
 * @param {Array} [Attendees]
 * @param {Array<PGPKey>|PGPKey} publicKeys - The public keys of the calendar
 * @param {PGPKey} sharedSessionKey
 * @param {PGPKey} calendarSessionKey
 * @returns {Promise}
 */
export const readCalendarEvent = async ({
    event: { SharedEvents = [], CalendarEvents = [], PersonalEventContent, AttendeesEvent, Attendees = [] },
    publicKeys,
    sharedSessionKey,
    calendarSessionKey
}) => {
    const sharedPart = SharedEvents.reduce((acc, data) => {
        acc[data.Type] = data;
        return acc;
    }, {});
    const calendarPart = CalendarEvents.reduce((acc, data) => {
        acc[data.Type] = data;
        return acc;
    }, {});
    const personalPartSignedPart = PersonalEventContent;
    const attendeesPartEncrypted = AttendeesEvent;

    const [
        [sharedSignedResult, sharedEncryptedResult],
        [calendarSignedResult, calendarEncryptedResult],
        personalResult,
        attendeesResult
    ] = await Promise.all([
        decryptAndVerifyPart(sharedPart, publicKeys, sharedSessionKey),
        decryptAndVerifyPart(calendarPart, publicKeys, calendarSessionKey),
        personalPartSignedPart &&
            verifySignedCard(personalPartSignedPart.Data, personalPartSignedPart.Signature, publicKeys),
        attendeesPartEncrypted &&
            decryptCard(
                deserializeUint8Array(attendeesPartEncrypted.Data),
                attendeesPartEncrypted.Signature,
                publicKeys,
                sharedSessionKey
            )
    ]);

    return {
        ...parse(unwrap(sharedEncryptedResult)),
        ...parse(unwrap(sharedSignedResult)),
        ...(calendarEncryptedResult && parse(unwrap(calendarEncryptedResult))),
        ...(calendarSignedResult && parse(unwrap(calendarSignedResult))),
        ...(personalResult && parse(unwrap(personalResult))),
        ...(attendeesResult && toInternalAttendee(parse(unwrap(attendeesResult)), Attendees))
    };
};
