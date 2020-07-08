import { OpenPGPKey, SessionKey } from 'pmcrypto';

import { deserializeUint8Array } from '../helpers/serialization';
import { SimpleMap } from '../interfaces/utils';
import { decryptAndVerifyCalendarEvent, getDecryptedSessionKey, verifySignedCard } from './decrypt';
import { parse } from './vcal';
import { unwrap } from './helper';
import { toInternalAttendee } from './attendees';
import { CalendarEventData, CalendarEvent, CalendarPersonalEventData } from '../interfaces/calendar';
import { VcalVeventComponent } from '../interfaces/calendar/VcalModel';

export const readSessionKey = (KeyPacket: string, privateKeys: OpenPGPKey | OpenPGPKey[]) => {
    return getDecryptedSessionKey(deserializeUint8Array(KeyPacket), privateKeys);
};

/**
 * Read the session keys.
 */
export const readSessionKeys = (
    { SharedKeyPacket, CalendarKeyPacket }: CalendarEvent,
    privateKeys: OpenPGPKey | OpenPGPKey[]
) => {
    return Promise.all([
        getDecryptedSessionKey(deserializeUint8Array(SharedKeyPacket), privateKeys),
        CalendarKeyPacket ? getDecryptedSessionKey(deserializeUint8Array(CalendarKeyPacket), privateKeys) : undefined,
    ]);
};

/**
 * Read the parts of a calendar event into an internal vcal component.
 */
interface ReadCalendarEventArguments {
    event: CalendarEvent;
    mapPublicKeys: SimpleMap<OpenPGPKey | OpenPGPKey[]>;
    sharedSessionKey?: SessionKey;
    calendarSessionKey?: SessionKey;
}
export const readCalendarEvent = async ({
    event: { SharedEvents = [], CalendarEvents = [], AttendeesEvents = [], Attendees = [] },
    mapPublicKeys,
    sharedSessionKey,
    calendarSessionKey,
}: ReadCalendarEventArguments) => {
    const decryptedSharedEvents = await Promise.all(
        SharedEvents.map((event) => decryptAndVerifyCalendarEvent(event, mapPublicKeys, sharedSessionKey))
    );
    const decryptedCalendarEvents = await Promise.all(
        CalendarEvents.map((event) => decryptAndVerifyCalendarEvent(event, mapPublicKeys, calendarSessionKey))
    );
    const decryptedAttendeesEvents = await Promise.all(
        AttendeesEvents.map((event) => decryptAndVerifyCalendarEvent(event, mapPublicKeys, sharedSessionKey))
    );

    const sharedVevent = decryptedSharedEvents.reduce((acc, event) => {
        return { ...acc, ...(event && parse(unwrap(event))) };
    }, {});
    const calendarVevent = decryptedCalendarEvents.reduce((acc, event) => {
        return { ...acc, ...(event && parse(unwrap(event))) };
    }, {});
    const attendeesVevent = decryptedAttendeesEvents.reduce((acc, event) => {
        if (!event) {
            return acc;
        }
        return { ...acc, ...toInternalAttendee(parse(unwrap(event))) };
    }, {});

    return { ...sharedVevent, ...calendarVevent, ...attendeesVevent } as VcalVeventComponent;
};

export const readPersonalPart = async (
    { Data, Signature }: CalendarEventData,
    publicKeys: OpenPGPKey | OpenPGPKey[]
) => {
    const result = await verifySignedCard(Data, Signature, publicKeys);
    return parse(unwrap(result)) as VcalVeventComponent;
};

export const getPersonalPartMap = ({ PersonalEvent = [] }: CalendarEvent) => {
    return PersonalEvent.reduce<{ [key: string]: CalendarPersonalEventData }>((acc, result) => {
        const { MemberID } = result;
        acc[MemberID] = result;
        return acc;
    }, {});
};
