import { OpenPGPKey, SessionKey } from 'pmcrypto';

import { deserializeUint8Array } from '../helpers/serialization';
import { SimpleMap } from '../interfaces/utils';
import { decryptAndVerifyCalendarEvent, getDecryptedSessionKey, verifySignedCard } from './decrypt';
import { parse } from './vcal';
import { unwrap } from './helper';
import { toInternalAttendee } from './attendees';
import { CalendarEventData, CalendarEvent, CalendarPersonalEventData } from '../interfaces/calendar';
import { VcalAttendeeProperty, VcalVeventComponent } from '../interfaces/calendar/VcalModel';
import { withRequiredProperties } from './veventHelper';
import { getDateProperty, getDateTimeProperty } from './vcalConverter';
import { fromUTCDate } from '../date/timezone';

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
    publicKeysMap: SimpleMap<OpenPGPKey | OpenPGPKey[]>;
    sharedSessionKey?: SessionKey;
    calendarSessionKey?: SessionKey;
}

const DEFAULT_VCALEVENT: VcalVeventComponent = withRequiredProperties({
    uid: {
        value: 'default-uid'
    },
    component: 'vevent',
    dtstart: getDateProperty({ year: 1970, month: 1, day: 1 }),
    dtstamp: getDateTimeProperty(fromUTCDate(new Date()))
});

export const readCalendarEvent = async ({
    event: { SharedEvents = [], CalendarEvents = [], AttendeesEvents = [], Attendees = [] },
    publicKeysMap,
    sharedSessionKey,
    calendarSessionKey,
}: ReadCalendarEventArguments) => {
    const [decryptedSharedEvents, decryptedCalendarEvents, decryptedAttendeesEvents] = await Promise.all([
        Promise.all(SharedEvents.map((e) => decryptAndVerifyCalendarEvent(e, publicKeysMap, sharedSessionKey))),
        Promise.all(CalendarEvents.map((e) => decryptAndVerifyCalendarEvent(e, publicKeysMap, calendarSessionKey))),
        Promise.all(AttendeesEvents.map((e) => decryptAndVerifyCalendarEvent(e, publicKeysMap, sharedSessionKey)))
    ]);

    const vevent = [...decryptedSharedEvents, ...decryptedCalendarEvents].reduce<VcalVeventComponent>((acc, event) => {
        if (!event) {
            return acc;
        }
        return { ...acc, ...(event && parse(unwrap(event))) };
    }, DEFAULT_VCALEVENT);

    const veventAttendees = decryptedAttendeesEvents.reduce<VcalAttendeeProperty[]>((acc, event) => {
        if (!event) {
            return acc;
        }
        return acc.concat(toInternalAttendee(parse(unwrap(event)), Attendees));
    }, []);

    if (!veventAttendees.length) {
        return vevent;
    }

    return {
        ...vevent,
        attendee: veventAttendees
    };
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
