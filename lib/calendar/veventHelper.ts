import { fromUTCDate } from '../date/timezone';
import { omit, pick } from '../helpers/object';
import { CalendarEventData } from '../interfaces/calendar';
import { VcalValarmComponent, VcalVeventComponent } from '../interfaces/calendar/VcalModel';
import { RequireOnly } from '../interfaces/utils';
import { fromInternalAttendee } from './attendees';
import { CALENDAR_CARD_TYPE } from './constants';
import { generateUID, hasMoreThan, wrap } from './helper';
import { AttendeeClearPartResult, AttendeePart } from './interface';
import { serialize } from './vcal';
import { dateTimeToProperty } from './vcalConverter';

const { ENCRYPTED_AND_SIGNED, SIGNED, CLEAR_TEXT } = CALENDAR_CARD_TYPE;

export const SHARED_SIGNED_FIELDS = [
    'uid',
    'dtstamp',
    'dtstart',
    'dtend',
    'recurrence-id',
    'rrule',
    'exdate',
    'organizer',
    'sequence',
] as const;
export const SHARED_ENCRYPTED_FIELDS = ['uid', 'dtstamp', 'created', 'description', 'summary', 'location'] as const;

export const CALENDAR_SIGNED_FIELDS = ['uid', 'dtstamp', 'status', 'transp'] as const;
export const CALENDAR_ENCRYPTED_FIELDS = ['uid', 'dtstamp', 'comment'] as const;

export const USER_SIGNED_FIELDS = ['uid', 'dtstamp'] as const;
export const USER_ENCRYPTED_FIELDS = [] as const;

export const ATTENDEES_SIGNED_FIELDS = [] as const;
export const ATTENDEES_ENCRYPTED_FIELDS = ['uid', 'attendee'] as const;

const REQUIRED_SET = new Set(['uid', 'dtstamp'] as const);

// Set of taken keys to put the rest
const TAKEN_KEYS = [
    ...new Set([
        ...SHARED_SIGNED_FIELDS,
        ...SHARED_ENCRYPTED_FIELDS,
        ...CALENDAR_SIGNED_FIELDS,
        ...CALENDAR_ENCRYPTED_FIELDS,
        ...USER_SIGNED_FIELDS,
        ...USER_ENCRYPTED_FIELDS,
        ...ATTENDEES_ENCRYPTED_FIELDS,
        ...ATTENDEES_SIGNED_FIELDS,
    ]),
] as const;

export const getReadableCard = (cards: CalendarEventData[]) => {
    return cards.find(({ Type }) => [CLEAR_TEXT, SIGNED].includes(Type));
};

export const withUid = <T>(properties: VcalVeventComponent & T): VcalVeventComponent & T => {
    if (properties.uid) {
        return properties;
    }
    return {
        ...properties,
        uid: { value: generateUID() },
    };
};

export const withSummary = <T>(properties: VcalVeventComponent & T): VcalVeventComponent & T => {
    if (properties.summary) {
        return properties;
    }
    return {
        ...properties,
        summary: { value: '' },
    };
};

export const withDtstamp = <T>(
    properties: RequireOnly<VcalVeventComponent, 'uid' | 'component' | 'dtstart'> & T
): VcalVeventComponent & T => {
    if (properties.dtstamp) {
        return properties as VcalVeventComponent & T;
    }
    return {
        ...properties,
        dtstamp: dateTimeToProperty(fromUTCDate(new Date()), true),
    };
};

export const withRequiredProperties = <T>(properties: VcalVeventComponent & T): VcalVeventComponent & T => {
    return withDtstamp(withUid(properties));
};

export const getSharedPart = (properties: VcalVeventComponent) => {
    return {
        [SIGNED]: pick(properties, SHARED_SIGNED_FIELDS),
        [ENCRYPTED_AND_SIGNED]: pick(properties, SHARED_ENCRYPTED_FIELDS),
    };
};

export const getCalendarPart = (properties: VcalVeventComponent) => {
    return {
        [SIGNED]: pick(properties, CALENDAR_SIGNED_FIELDS),
        [ENCRYPTED_AND_SIGNED]: pick(properties, CALENDAR_ENCRYPTED_FIELDS),
    };
};

export const getUserPart = (veventProperties: VcalVeventComponent) => {
    return {
        [SIGNED]: pick(veventProperties, USER_SIGNED_FIELDS),
        [ENCRYPTED_AND_SIGNED]: pick(veventProperties, USER_ENCRYPTED_FIELDS),
    };
};

export const getAttendeesPart = (
    veventProperties: VcalVeventComponent
): {
    [CLEAR_TEXT]: AttendeeClearPartResult[];
    [ENCRYPTED_AND_SIGNED]: Partial<VcalVeventComponent>;
} => {
    const formattedAttendees: { [CLEAR_TEXT]: AttendeeClearPartResult[]; attendee: AttendeePart[] } = {
        [CLEAR_TEXT]: [],
        attendee: [],
    };
    if (Array.isArray(veventProperties.attendee)) {
        for (const attendee of veventProperties.attendee) {
            const { clear, attendee: newAttendee } = fromInternalAttendee(attendee);
            formattedAttendees[CLEAR_TEXT].push(clear);
            formattedAttendees.attendee.push(newAttendee);
        }
    }

    if (!formattedAttendees.attendee.length) {
        return {
            [ENCRYPTED_AND_SIGNED]: {},
            [CLEAR_TEXT]: [],
        };
    }

    const result: Pick<VcalVeventComponent, 'uid' | 'attendee'> = {
        uid: veventProperties.uid,
        attendee: formattedAttendees.attendee,
    };

    return {
        [ENCRYPTED_AND_SIGNED]: result,
        [CLEAR_TEXT]: formattedAttendees[CLEAR_TEXT],
    };
};

const toResult = (veventProperties: Partial<VcalVeventComponent>, veventComponents: VcalValarmComponent[] = []) => {
    return wrap(
        serialize({
            ...veventProperties,
            component: 'vevent',
            components: veventComponents,
        })
    );
};

/**
 * Ignores the result if the vevent does not contain anything more than the required set (uid, dtstamp, and children).
 */
const toResultOptimized = (
    veventProperties: Partial<VcalVeventComponent>,
    veventComponents: VcalValarmComponent[] = []
) => {
    return hasMoreThan(REQUIRED_SET, veventProperties) || veventComponents.length
        ? toResult(veventProperties, veventComponents)
        : undefined;
};

/**
 * Split the internal vevent component into the parts expected by the API.
 */
export const getVeventParts = ({ components, ...properties }: VcalVeventComponent) => {
    const restProperties = omit(properties, TAKEN_KEYS);

    const sharedPart = getSharedPart(properties);
    const calendarPart = getCalendarPart(properties);
    const personalPart = getUserPart(properties);
    const attendeesPart = getAttendeesPart(properties);

    return {
        sharedPart: {
            [SIGNED]: toResult(sharedPart[SIGNED]),
            // Store all the rest of the properties in the shared encrypted part
            [ENCRYPTED_AND_SIGNED]: toResult({
                ...sharedPart[ENCRYPTED_AND_SIGNED],
                ...restProperties,
            }),
        },
        calendarPart: {
            [SIGNED]: toResultOptimized(calendarPart[SIGNED]),
            [ENCRYPTED_AND_SIGNED]: toResultOptimized(calendarPart[ENCRYPTED_AND_SIGNED]),
        },
        personalPart: {
            // Assume all sub-components are valarm that go in the personal part
            [SIGNED]: toResultOptimized(personalPart[SIGNED], components),
            // Nothing to encrypt for now
            [ENCRYPTED_AND_SIGNED]: undefined,
        },
        attendeesPart: {
            // Nothing to sign for now
            [SIGNED]: undefined,
            [ENCRYPTED_AND_SIGNED]: toResultOptimized(attendeesPart[ENCRYPTED_AND_SIGNED]),
            [CLEAR_TEXT]: attendeesPart[CLEAR_TEXT],
        },
    };
};
