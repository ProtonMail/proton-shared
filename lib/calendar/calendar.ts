import { hasBit } from '../helpers/bitset';
import { CALENDAR_FLAGS } from './constants';
import { Calendar } from '../interfaces/calendar';
import { getEmailParts } from '../helpers/email';

export const getIsCalendarActive = ({ Flags } = { Flags: 0 }) => {
    return hasBit(Flags, CALENDAR_FLAGS.ACTIVE);
};

export const getIsCalendarDisabled = ({ Flags } = { Flags: 0 }) => {
    return hasBit(Flags, CALENDAR_FLAGS.SELF_DISABLED) || hasBit(Flags, CALENDAR_FLAGS.SUPER_OWNER_DISABLED);
};

export const getIsCalendarProbablyActive = (calendar = { Flags: 0 }) => {
    // Calendars are treated as "active" if flags are undefined, this can happen when a new calendar was created and received through the event manager.
    // In this case, we assume everything went well and treat it as an active calendar.
    return calendar.Flags === undefined || (!getIsCalendarDisabled(calendar) && getIsCalendarActive(calendar));
};

export const getProbablyActiveCalendars = (calendars: Calendar[] = []) => {
    return calendars.filter(getIsCalendarProbablyActive);
};

export const getDefaultCalendar = (calendars: Calendar[] = [], defaultCalendarID = '') => {
    if (!calendars.length) {
        return;
    }
    return calendars.find(({ ID }) => ID === defaultCalendarID) || calendars[0];
};

export const normalizeEmailForToken = (email: string) => {
    let output = email;
    // Filter out any bad characters: remove all characters except letters, digits and !#$%&'*+-=?^_`{|}~@.[]
    output =
        output
            .toLowerCase()
            .match(/([a-z0-9!#$%&'*+-=?^_`{|}~@[\]])/g)
            ?.join('') || '';
    // eslint-disable-next-line prefer-const
    let [localPart, domainPart] = getEmailParts(output);
    // Throw out the + and everything after it
    [localPart] = localPart.split('+');
    localPart = localPart
        .split('')
        .filter((char) => !'._-'.includes(char))
        .join('');
    return `${localPart}@${domainPart}`;
};
