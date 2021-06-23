import { addDays } from '../date-fns-utc';
import { fromUTCDate } from '../date/timezone';
import { VcalDateOrDateTimeProperty, VcalRruleProperty, VcalVeventComponent } from '../interfaces/calendar/VcalModel';
import { getOccurrencesBetween } from './recurring';
import { getIsDateTimeValue, getIsPropertyAllDay, getPropertyTzid } from './vcalHelper';
import { getUntilProperty, propertyToUTCDate } from './vcalConverter';

export const withRruleUntil = (rrule: VcalRruleProperty, dtstart: VcalDateOrDateTimeProperty): VcalRruleProperty => {
    const until = rrule.value?.until;
    const isAllDay = getIsPropertyAllDay(dtstart);
    const tzid = getPropertyTzid(dtstart);
    if (!until) {
        return rrule;
    }
    if (isAllDay || !getIsDateTimeValue(until)) {
        return {
            ...rrule,
            value: {
                ...rrule.value,
                until: getUntilProperty(until, isAllDay, tzid),
            },
        };
    }
    // if UNTIL is not a end-of-the-day date-time, determine the end-of-the-day date to use
    const inclusiveUntil = getUntilProperty(until, isAllDay, tzid);
    const inclusiveUntilDate = propertyToUTCDate({ value: inclusiveUntil });
    const exclusiveUntilDate = addDays(inclusiveUntilDate, -1);
    const component = { dtstart, rrule } as VcalVeventComponent;
    const exclude = getOccurrencesBetween(component, +exclusiveUntilDate, +inclusiveUntilDate).length === 0;
    return {
        ...rrule,
        value: {
            ...rrule.value,
            until: exclude ? getUntilProperty(fromUTCDate(exclusiveUntilDate), isAllDay, tzid) : inclusiveUntil,
        },
    };
};
