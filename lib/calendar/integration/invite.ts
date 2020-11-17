import { c } from 'ttag';
import { getVtimezones } from '../../api/calendars';
import { format as formatUTC } from '../../date-fns-utc';
import { formatTimezoneOffset, getTimezoneOffset, toUTCDate } from '../../date/timezone';
import { unique } from '../../helpers/array';
import { cleanEmail, normalizeInternalEmail } from '../../helpers/email';
import isTruthy from '../../helpers/isTruthy';
import { omit, pick } from '../../helpers/object';
import { dateLocale } from '../../i18n';
import { Address, Api } from '../../interfaces';
import {
    CalendarSettings,
    Participant,
    SETTINGS_NOTIFICATION_TYPE,
    VcalAttendeeProperty,
    VcalOrganizerProperty,
    VcalValarmComponent,
    VcalVcalendar,
    VcalVeventComponent,
    VcalVtimezoneComponent,
} from '../../interfaces/calendar';
import { ContactEmail } from '../../interfaces/contacts';
import { RequireSome, SimpleMap } from '../../interfaces/utils';
import { formatSubject, RE_PREFIX } from '../../mail/messages';
import { getAttendeeEmail } from '../attendees';
import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from '../constants';
import { getDisplayTitle } from '../helper';
import { getIsRruleEqual } from '../rruleEqual';
import { fromTriggerString, parse, serialize } from '../vcal';
import { getAllDayInfo, getHasModifiedDateTimes, propertyToUTCDate } from '../vcalConverter';
import {
    getAttendeePartstat,
    getAttendeeRole,
    getIsAlarmComponent,
    getIsAllDay,
    getPropertyTzid,
    getSequence,
} from '../vcalHelper';
import { withDtstamp, withSummary } from '../veventHelper';

export const getParticipantHasAddressID = (
    participant: Participant
): participant is RequireSome<Participant, 'addressID'> => {
    return !!participant.addressID;
};

export const getParticipant = (
    participant: VcalAttendeeProperty | VcalOrganizerProperty,
    contactEmails: ContactEmail[],
    ownAddresses: Address[],
    emailTo?: string,
    index?: number
): Participant => {
    const emailAddress = getAttendeeEmail(participant);
    const normalizedEmailAddress = normalizeInternalEmail(emailAddress);
    const selfAddress = ownAddresses.find(({ Email }) => normalizeInternalEmail(Email) === normalizedEmailAddress);
    const isYou = emailTo ? normalizeInternalEmail(emailTo) === normalizedEmailAddress : !!selfAddress;
    const contact = contactEmails.find(({ Email }) => cleanEmail(Email) === cleanEmail(emailAddress));
    const participantName = participant?.parameters?.cn || emailAddress;
    const displayName = selfAddress?.DisplayName || contact?.Name || participantName;
    const result: Participant = {
        vcalComponent: participant,
        name: participantName,
        emailAddress,
        displayName: isYou ? c('Participant name').t`You` : displayName,
        displayEmail: emailAddress,
    };
    const { partstat, role, email } = (participant as VcalAttendeeProperty).parameters || {};
    if (partstat) {
        result.partstat = getAttendeePartstat(participant);
    }
    if (role) {
        result.role = getAttendeeRole(participant);
    }
    if (email) {
        result.displayEmail = email;
    }
    if (selfAddress) {
        result.addressID = selfAddress.ID;
        // Use Proton form of the email address (important for sending email)
        result.emailAddress = selfAddress.Email;
        // Use Proton name when sending out the email
        result.name = selfAddress.DisplayName || participantName;
    }
    if (index !== undefined) {
        result.attendeeIndex = index;
    }
    return result;
};

interface CreateInviteVeventParams {
    method: ICAL_METHOD;
    emailTo?: string;
    partstat?: ICAL_ATTENDEE_STATUS;
    vevent: VcalVeventComponent;
    keepDtstamp?: boolean;
}

export const createInviteVevent = ({ method, emailTo, partstat, vevent, keepDtstamp }: CreateInviteVeventParams) => {
    if (method === ICAL_METHOD.REPLY && emailTo) {
        // only put RFC-mandatory fields to make reply as short as possible
        // rrule, summary and location are also included for a better UI in the external provider widget
        const propertiesToKeep: (keyof VcalVeventComponent)[] = [
            'uid',
            'dtstart',
            'dtend',
            'sequence',
            'recurrence-id',
            'organizer',
            'rrule',
            'location',
            'summary',
        ];
        // use current time as dtstamp unless indicated otherwise
        if (keepDtstamp) {
            propertiesToKeep.push('dtstamp');
        }
        return withDtstamp({
            ...pick(vevent, propertiesToKeep),
            component: 'vevent',
            attendee: [
                {
                    value: emailTo,
                    parameters: { partstat },
                },
            ],
        });
    }
    if (method === ICAL_METHOD.REQUEST) {
        // strip alarms
        const propertiesToOmit: (keyof VcalVeventComponent)[] = ['components'];
        // use current time as dtstamp unless indicated otherwise
        if (!keepDtstamp) {
            propertiesToOmit.push('dtstamp');
        }
        // SUMMARY is mandatory in a REQUEST ics
        const veventWithSummary = withSummary(vevent);
        return withDtstamp(omit(veventWithSummary, propertiesToOmit) as VcalVeventComponent);
    }
};

interface CreateInviteIcsParams {
    method: ICAL_METHOD;
    prodId: string;
    emailTo?: string;
    partstat?: ICAL_ATTENDEE_STATUS;
    vevent: VcalVeventComponent;
    vtimezones?: VcalVtimezoneComponent[];
    keepDtstamp?: boolean;
}

export const createInviteIcs = ({
    method,
    prodId,
    emailTo,
    partstat,
    vevent,
    vtimezones,
    keepDtstamp,
}: CreateInviteIcsParams): string => {
    // use current time as dtstamp
    const inviteVevent = createInviteVevent({ method, vevent, emailTo, partstat, keepDtstamp });
    if (!inviteVevent) {
        throw new Error('Invite vevent failed to be created');
    }
    const inviteVcal: RequireSome<VcalVcalendar, 'components'> = {
        component: 'vcalendar',
        components: [inviteVevent],
        prodid: { value: prodId },
        version: { value: '2.0' },
        method: { value: method },
        calscale: { value: 'GREGORIAN' },
    };
    if (vtimezones?.length) {
        inviteVcal.components = [...vtimezones, ...inviteVcal.components];
    }
    return serialize(inviteVcal);
};

export const findAttendee = (email: string, attendees: VcalAttendeeProperty[] = []) => {
    const cleanedEmail = cleanEmail(email);
    const index = attendees.findIndex((attendee) => cleanEmail(getAttendeeEmail(attendee)) === cleanedEmail);
    const attendee = index !== -1 ? attendees[index] : undefined;
    return { index, attendee };
};

export function getSelfAddressData({
    isOrganizer,
    organizer,
    attendees = [],
    addresses = [],
}: {
    isOrganizer: boolean;
    organizer?: VcalOrganizerProperty;
    attendees?: VcalAttendeeProperty[];
    addresses?: Address[];
}) {
    if (isOrganizer) {
        if (!organizer) {
            // old events will not have organizer
            return {};
        }
        const organizerEmail = normalizeInternalEmail(getAttendeeEmail(organizer));
        return {
            selfAddress: addresses.find(({ Email }) => normalizeInternalEmail(Email) === organizerEmail),
        };
    }
    const normalizedAttendeeEmails = attendees.map((attendee) => cleanEmail(getAttendeeEmail(attendee)));
    // start checking active addresses
    const activeAddresses = addresses.filter(({ Status }) => Status !== 0);
    const { selfActiveAttendee, selfActiveAddress, selfActiveAttendeeIndex } = activeAddresses.reduce<{
        selfActiveAttendee?: VcalAttendeeProperty;
        selfActiveAttendeeIndex?: number;
        selfActiveAddress?: Address;
        answeredAttendeeFound: boolean;
    }>(
        (acc, address) => {
            if (acc.answeredAttendeeFound) {
                return acc;
            }
            const cleanSelfEmail = cleanEmail(address.Email, true);
            const index = normalizedAttendeeEmails.findIndex((email) => email === cleanSelfEmail);
            if (index === -1) {
                return acc;
            }
            const attendee = attendees[index];
            const partstat = getAttendeePartstat(attendee);
            const answeredAttendeeFound = partstat !== ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
            if (answeredAttendeeFound || !(acc.selfActiveAttendee && acc.selfActiveAddress)) {
                return {
                    selfActiveAttendee: attendee,
                    selfActiveAddress: address,
                    selfActiveAttendeeIndex: index,
                    answeredAttendeeFound,
                };
            }
            return acc;
        },
        { answeredAttendeeFound: false }
    );
    if (selfActiveAttendee && selfActiveAddress) {
        return {
            selfAttendee: selfActiveAttendee,
            selfAddress: selfActiveAddress,
            selfAttendeeIndex: selfActiveAttendeeIndex,
        };
    }
    const disabledAddresses = addresses.filter(({ Status }) => Status === 0);
    const { selfDisabledAttendee, selfDisabledAddress, selfDisabledAttendeeIndex } = disabledAddresses.reduce<{
        selfDisabledAttendee?: VcalAttendeeProperty;
        selfDisabledAttendeeIndex?: number;
        selfDisabledAddress?: Address;
        answeredAttendeeFound: boolean;
    }>(
        (acc, address) => {
            if (acc.answeredAttendeeFound) {
                return acc;
            }
            const cleanSelfEmail = cleanEmail(address.Email, true);
            const index = normalizedAttendeeEmails.findIndex((email) => email === cleanSelfEmail);
            if (index === -1) {
                return acc;
            }
            const attendee = attendees[index];
            const partstat = getAttendeePartstat(attendee);
            const answeredAttendeeFound = partstat !== ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
            if (answeredAttendeeFound || !(acc.selfDisabledAttendee && acc.selfDisabledAddress)) {
                return {
                    selfDisabledAttendee: attendee,
                    selfDisabledAttendeeIndex: index,
                    selfDisabledAddress: address,
                    answeredAttendeeFound,
                };
            }
            return acc;
        },
        { answeredAttendeeFound: false }
    );
    return {
        selfAttendee: selfDisabledAttendee,
        selfAddress: selfDisabledAddress,
        selfAttendeeIndex: selfDisabledAttendeeIndex,
    };
}

export const getInvitedEventWithAlarms = (
    vevent: VcalVeventComponent,
    partstat: ICAL_ATTENDEE_STATUS,
    calendarSettings?: CalendarSettings,
    oldPartstat?: ICAL_ATTENDEE_STATUS
) => {
    const { components } = vevent;
    const otherComponents = components?.filter((component) => !getIsAlarmComponent(component));

    if ([ICAL_ATTENDEE_STATUS.DECLINED, ICAL_ATTENDEE_STATUS.NEEDS_ACTION].includes(partstat)) {
        // remove all alarms in this case
        if (otherComponents?.length) {
            return {
                ...vevent,
                components: otherComponents,
            };
        }
        return omit(vevent, ['components']);
    }
    if (oldPartstat && [ICAL_ATTENDEE_STATUS.ACCEPTED, ICAL_ATTENDEE_STATUS.TENTATIVE].includes(oldPartstat)) {
        // Leave alarms as they are
        return { ...vevent };
    }

    // otherwise add calendar alarms
    if (!calendarSettings) {
        throw new Error('Cannot retrieve calendar default notifications');
    }
    const isAllDay = getIsAllDay(vevent);
    const notifications = isAllDay
        ? calendarSettings.DefaultFullDayNotifications
        : calendarSettings.DefaultPartDayNotifications;
    const valarmComponents = notifications
        .filter(({ Type }) => Type === SETTINGS_NOTIFICATION_TYPE.DEVICE)
        .map<VcalValarmComponent>(({ Trigger }) => ({
            component: 'valarm',
            action: { value: 'DISPLAY' },
            trigger: { value: fromTriggerString(Trigger) },
        }));

    return {
        ...vevent,
        components: components ? components.concat(valarmComponents) : valarmComponents,
    };
};

export const getSelfAttendeeToken = (vevent?: VcalVeventComponent, addresses: Address[] = []) => {
    if (!vevent?.attendee) {
        return;
    }
    const { selfAddress, selfAttendeeIndex } = getSelfAttendeeData(vevent.attendee, addresses);
    if (!selfAddress || selfAttendeeIndex === undefined) {
        return;
    }
    return vevent.attendee[selfAttendeeIndex].parameters?.['x-pm-token'];
};

export const generateVtimezonesComponents = async (
    api: Api,
    { dtstart, dtend }: VcalVeventComponent
): Promise<VcalVtimezoneComponent[]> => {
    const startTimezone = getPropertyTzid(dtstart);
    const endTimezone = dtend ? getPropertyTzid(dtend) : undefined;
    const tzids = unique(
        [startTimezone, endTimezone].filter(isTruthy).filter((tzid) => isTruthy(tzid) && tzid.toLowerCase() !== 'utc')
    );
    const encodedTzids = tzids.map((tzid) => encodeURIComponent(tzid));
    if (!tzids.length) {
        return Promise.resolve([]);
    }
    const { Timezones = {} } = await api<{ Timezones: SimpleMap<string> }>(getVtimezones(encodedTzids));
    return tzids.map((tzid) => {
        const vtimezoneString = Timezones[tzid];
        if (!vtimezoneString) {
            throw new Error('Could not obtain timezone');
        }
        return parse(vtimezoneString) as VcalVtimezoneComponent;
    });
};

export const generateEmailSubject = (method: ICAL_METHOD, vevent: VcalVeventComponent, isCreateEvent?: boolean) => {
    if (method === ICAL_METHOD.REQUEST) {
        const { dtstart, dtend } = vevent;
        const { isAllDay, isSingleAllDay } = getAllDayInfo(dtstart, dtend);
        if (isAllDay) {
            const formattedStartDate = formatUTC(toUTCDate(dtstart.value), 'PP', { locale: dateLocale });
            return isSingleAllDay
                ? `Invitation for an event on ${formattedStartDate}`
                : `Invitation for an event starting on ${formattedStartDate}`;
        }
        const formattedStartDateTime = formatUTC(toUTCDate(vevent.dtstart.value), 'PPp', { locale: dateLocale });
        const { offset } = getTimezoneOffset(propertyToUTCDate(dtstart), getPropertyTzid(dtstart) || 'UTC');
        const formattedOffset = `GMT${formatTimezoneOffset(offset)}`;
        return isCreateEvent
            ? `Invitation for an event starting on ${formattedStartDateTime} (${formattedOffset})`
            : `Update for an event starting on ${formattedStartDateTime} (${formattedOffset})`;
    }
    if (method === ICAL_METHOD.REPLY) {
        return formatSubject(`Invitation: ${getDisplayTitle(vevent.summary?.value)}`, RE_PREFIX);
    }
    throw new Error('Unexpected method');
};

export const getHasUpdatedInviteData = ({
    newVevent,
    oldVevent,
    hasModifiedDateTimes,
}: {
    newVevent: VcalVeventComponent;
    oldVevent?: VcalVeventComponent;
    hasModifiedDateTimes?: boolean;
}) => {
    if (!oldVevent) {
        return;
    }
    const hasUpdatedDateTimes =
        hasModifiedDateTimes !== undefined ? hasModifiedDateTimes : getHasModifiedDateTimes(newVevent, oldVevent);
    const hasUpdatedTitle = newVevent.summary?.value !== oldVevent.summary?.value;
    const hasUpdatedDescription = newVevent.description?.value !== oldVevent.description?.value;
    const hasUpdatedLocation = newVevent.location?.value !== oldVevent.location?.value;
    const hasUpdatedRrule = !getIsRruleEqual(newVevent.rrule, oldVevent.rrule);
    return hasUpdatedDateTimes || hasUpdatedTitle || hasUpdatedDescription || hasUpdatedLocation || hasUpdatedRrule;
};

export const getUpdatedInviteVevent = (
    newVevent: VcalVeventComponent,
    oldVevent: VcalVeventComponent,
    method?: ICAL_METHOD
) => {
    if (method === ICAL_METHOD.REQUEST && getSequence(newVevent) > getSequence(oldVevent)) {
        if (!newVevent.attendee?.length) {
            return { ...newVevent };
        }
        const withResetPartstatAttendees = newVevent.attendee.map((attendee) => ({
            ...attendee,
            parameters: {
                ...attendee.parameters,
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
            },
        }));
        return { ...newVevent, attendee: withResetPartstatAttendees };
    }
    return { ...newVevent };
};
