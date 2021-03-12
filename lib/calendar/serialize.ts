import { OpenPGPKey, SessionKey } from 'pmcrypto';
import { CreateCalendarEventBlobData } from '../api/calendars';
import { RequireSome } from '../interfaces/utils';

import { CALENDAR_CARD_TYPE } from './constants';
import { getVeventParts } from './veventHelper';
import { createSessionKey, encryptPart, getEncryptedSessionKey, signPart } from './encrypt';
import { VcalVeventComponent } from '../interfaces/calendar';
import { getIsEventComponent } from './vcalHelper';
import { formatData } from './formatData';

const { ENCRYPTED_AND_SIGNED, SIGNED, CLEAR_TEXT } = CALENDAR_CARD_TYPE;

export const getHasSharedKeyPacket = (
    data: CreateCalendarEventBlobData
): data is RequireSome<CreateCalendarEventBlobData, 'SharedKeyPacket'> => !!data.SharedKeyPacket;

/**
 * Split the properties of the component into parts.
 */
const getParts = (eventComponent: VcalVeventComponent) => {
    if (!getIsEventComponent(eventComponent)) {
        throw new Error('Type other than vevent not supported');
    }
    return getVeventParts(eventComponent);
};

/**
 * Create a calendar event by encrypting and serializing an internal vcal component.
 */
interface CreateCalendarEventArguments {
    eventComponent: VcalVeventComponent;
    privateKey: OpenPGPKey;
    publicKey: OpenPGPKey;
    signingKey: OpenPGPKey;
    sharedSessionKey?: SessionKey;
    calendarSessionKey?: SessionKey;
    isSwitchCalendar: boolean;
}
export const createCalendarEvent = async ({
    eventComponent,
    privateKey,
    publicKey,
    signingKey,
    sharedSessionKey: oldSharedSessionKey,
    calendarSessionKey: oldCalendarSessionKey,
    isSwitchCalendar = false,
}: CreateCalendarEventArguments) => {
    const { sharedPart, calendarPart, personalPart, attendeesPart } = getParts(eventComponent);

    // If there is no encrypted calendar part, a calendar session key is not needed.
    const shouldHaveCalendarKey = !!calendarPart[ENCRYPTED_AND_SIGNED];

    const [calendarSessionKey, sharedSessionKey] = await Promise.all([
        shouldHaveCalendarKey ? oldCalendarSessionKey || createSessionKey(publicKey) : undefined,
        oldSharedSessionKey || createSessionKey(publicKey),
    ]);

    const [
        encryptedCalendarSessionKey,
        encryptedSharedSessionKey,
        sharedSignedPart,
        sharedEncryptedPart,
        calendarSignedPart,
        calendarEncryptedPart,
        personalSignedPart,
        attendeesEncryptedPart,
    ] = await Promise.all([
        // If we're updating an event (but not switching calendar), no need to encrypt again the session keys
        oldCalendarSessionKey && !isSwitchCalendar
            ? undefined
            : calendarSessionKey
            ? getEncryptedSessionKey(calendarSessionKey, privateKey)
            : undefined,
        oldSharedSessionKey && !isSwitchCalendar ? undefined : getEncryptedSessionKey(sharedSessionKey, privateKey),
        signPart(sharedPart[SIGNED], signingKey),
        encryptPart(sharedPart[ENCRYPTED_AND_SIGNED], signingKey, sharedSessionKey),
        signPart(calendarPart[SIGNED], signingKey),
        calendarSessionKey && encryptPart(calendarPart[ENCRYPTED_AND_SIGNED], signingKey, calendarSessionKey),
        signPart(personalPart[SIGNED], signingKey),
        encryptPart(attendeesPart[ENCRYPTED_AND_SIGNED], signingKey, sharedSessionKey),
    ]);

    return formatData({
        sharedSignedPart,
        sharedEncryptedPart,
        sharedSessionKey: encryptedSharedSessionKey,
        calendarSignedPart,
        calendarEncryptedPart,
        calendarSessionKey: encryptedCalendarSessionKey,
        personalSignedPart,
        attendeesEncryptedPart,
        attendeesClearPart: attendeesPart[CLEAR_TEXT],
    });
};
