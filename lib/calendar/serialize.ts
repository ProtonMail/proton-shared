import { OpenPGPKey, OpenPGPSignature, SessionKey } from 'pmcrypto';
import { CreateCalendarEventBlobData } from '../api/calendars';
import { uint8ArrayToBase64String } from '../helpers/encoding';
import { RequireSome } from '../interfaces/utils';

import { getVeventParts } from './veventHelper';
import { createSessionKey, encryptPart, getEncryptedSessionKey, signPart } from './encrypt';
import { CALENDAR_CARD_TYPE } from './constants';
import { VcalVeventComponent } from '../interfaces/calendar/VcalModel';
import { AttendeeClearPartResult, EncryptPartResult, SignPartResult } from './interface';
import isTruthy from '../helpers/isTruthy';
import { getIsEventComponent } from './vcalHelper';

const { ENCRYPTED_AND_SIGNED, SIGNED, CLEAR_TEXT } = CALENDAR_CARD_TYPE;

// Wrong typings in openpgp.d.ts...
const getArmoredSignatureString = (signature: OpenPGPSignature) => (signature.armor() as unknown) as string;

export const getHasSharedKeyPacket = (
    data: CreateCalendarEventBlobData
): data is RequireSome<CreateCalendarEventBlobData, 'SharedKeyPacket'> => !!data.SharedKeyPacket;

/**
 * Format the data into what the API expects.
 */
interface FormatDataArguments {
    sharedSignedPart: SignPartResult;
    sharedEncryptedPart: EncryptPartResult;
    sharedSessionKey?: Uint8Array;
    calendarSignedPart?: SignPartResult;
    calendarEncryptedPart?: EncryptPartResult;
    calendarSessionKey?: Uint8Array;
    personalSignedPart?: SignPartResult;
    attendeesEncryptedPart?: EncryptPartResult;
    attendeesClearPart?: AttendeeClearPartResult[];
}
export const formatData = ({
    sharedSignedPart,
    sharedEncryptedPart,
    sharedSessionKey,
    calendarSignedPart,
    calendarEncryptedPart,
    calendarSessionKey,
    personalSignedPart,
    attendeesEncryptedPart,
    attendeesClearPart,
}: FormatDataArguments) => {
    return {
        SharedKeyPacket: sharedSessionKey ? uint8ArrayToBase64String(sharedSessionKey) : undefined,
        SharedEventContent: [
            // Shared part should always exists
            {
                Type: SIGNED,
                Data: sharedSignedPart.data,
                Signature: getArmoredSignatureString(sharedSignedPart.signature),
            },
            {
                Type: ENCRYPTED_AND_SIGNED,
                Data: uint8ArrayToBase64String(sharedEncryptedPart.dataPacket),
                Signature: getArmoredSignatureString(sharedEncryptedPart.signature),
            },
        ],
        CalendarKeyPacket:
            calendarEncryptedPart && calendarSessionKey ? uint8ArrayToBase64String(calendarSessionKey) : undefined,
        CalendarEventContent:
            calendarSignedPart || calendarEncryptedPart
                ? [
                      // Calendar parts are optional
                      calendarSignedPart && {
                          Type: SIGNED,
                          Data: calendarSignedPart.data,
                          Signature: getArmoredSignatureString(calendarSignedPart.signature),
                      },
                      calendarEncryptedPart && {
                          Type: ENCRYPTED_AND_SIGNED,
                          Data: uint8ArrayToBase64String(calendarEncryptedPart.dataPacket),
                          Signature: getArmoredSignatureString(calendarEncryptedPart.signature),
                      },
                  ].filter(isTruthy)
                : undefined,
        // Personal part is optional
        PersonalEventContent: personalSignedPart
            ? {
                  Type: SIGNED,
                  Data: personalSignedPart.data,
                  Signature: getArmoredSignatureString(personalSignedPart.signature),
              }
            : undefined,
        AttendeesEventContent: attendeesEncryptedPart
            ? [
                  {
                      Type: ENCRYPTED_AND_SIGNED,
                      Data: uint8ArrayToBase64String(attendeesEncryptedPart.dataPacket),
                      Signature: getArmoredSignatureString(attendeesEncryptedPart.signature),
                  },
              ]
            : undefined,
        Attendees: attendeesClearPart
            ? attendeesClearPart.map(({ token, status }) => ({
                  Token: token,
                  Status: status,
              }))
            : undefined,
    };
};

/**
 * Format just the personal data into what the API expects.
 */
export const formatPersonalData = (personalSignedPart?: SignPartResult) => {
    if (!personalSignedPart) {
        return;
    }
    return {
        Type: SIGNED,
        Data: personalSignedPart.data,
        Signature: getArmoredSignatureString(personalSignedPart.signature),
    };
};

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
    isCreateEvent: boolean;
    isSwitchCalendar: boolean;
}
export const createCalendarEvent = async ({
    eventComponent,
    privateKey,
    publicKey,
    signingKey,
    sharedSessionKey: oldSharedSessionKey,
    calendarSessionKey: oldCalendarSessionKey,
    isCreateEvent,
    isSwitchCalendar,
}: CreateCalendarEventArguments) => {
    const { sharedPart, calendarPart, personalPart, attendeesPart } = getParts(eventComponent);

    const isCreateOrSwitchCalendar = isCreateEvent || isSwitchCalendar;
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
        isCreateOrSwitchCalendar && calendarSessionKey
            ? getEncryptedSessionKey(calendarSessionKey, privateKey)
            : undefined,
        isCreateOrSwitchCalendar ? getEncryptedSessionKey(sharedSessionKey, privateKey) : undefined,
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

/**
 * Create just the personal event from an internal vcal component.
 */
interface CreatePersonalEventArguments {
    eventComponent: VcalVeventComponent;
    signingKey: OpenPGPKey;
}
export const createPersonalEvent = async ({ eventComponent, signingKey }: CreatePersonalEventArguments) => {
    const { personalPart } = getParts(eventComponent);

    const personalSignedPart = await signPart(personalPart[SIGNED], signingKey);

    return formatPersonalData(personalSignedPart);
};
