/* eslint-disable no-param-reassign */
import ICAL from 'ical.js';
import { icalValueToInternalValue, internalValueToIcalValue } from './vcal';
import { isIcalPropertyAllDay } from './vcalConverter';
import { toUTCDate } from '../date/timezone';

// TODO: Only 2 years
const MAX_EXPANSIONS = 730;

export const getIsRecurring = ({ rrule }) => {
    return !!rrule;
};

export const getOccurencesUntil = ({ dtstart: internalDtstart, rrule: internalRrule }, end, cache = {}) => {
    if (!cache.start) {
        const dtstartType = isIcalPropertyAllDay(internalDtstart) ? 'date' : 'date-time';
        const dtstart = internalValueToIcalValue(dtstartType, { ...internalDtstart.value, isUTC: true });
        const utcStart = toUTCDate(dtstart);

        cache.start = { dtstartType, dtstart, utcStart };
    }

    const { utcStart, dtstart, dtstartType } = cache.start;

    if (utcStart > end) {
        return;
    }

    if (!cache.iteration) {
        const rrule = internalValueToIcalValue('recur', internalRrule.value);
        const iterator = rrule.iterator(dtstart);
        cache.iteration = {
            iterator,
            inc: 0,
            result: []
        };
    }

    const { iterator, result } = cache.iteration;
    let { inc } = cache.iteration;

    let next;

    // IMPROVE THIS. It just adds an an event and adds an event.

    // eslint-disable-next-line no-cond-assign
    while (inc++ < MAX_EXPANSIONS && (next = iterator.next())) {
        const nextStart = toUTCDate(icalValueToInternalValue(dtstartType, next));
        result.push(+nextStart);

        if (nextStart > end) {
            break;
        }
    }

    cache.iteration.iterator = iterator;
    cache.iteration.inc = inc;

    return cache.iteration.result;
};

const cmpFunc = (a, b) => a - b;

const MINUTES_IN_MS = 60000;
const MINUTES_IN_DAY = 1440 * MINUTES_IN_MS;

const isInInterval = (a1, a2, b1, b2) => a1 <= b2 && a2 >= b1;

export const getOccurencesBetween = (occurences, eventDurationMs, start, end) => {
    if (!occurences) {
        return;
    }
    const searchStart = +start;
    const searchEnd = +end;

    // If event duration is greater than a day, fall back to a filter to not miss any events.
    if (eventDurationMs >= MINUTES_IN_DAY) {
        return occurences.filter((value) => isInInterval(value, value + eventDurationMs, searchStart, searchEnd));
    }

    const startIdx = ICAL.helpers.binsearchInsert(occurences, searchStart, cmpFunc);
    const endIdx = ICAL.helpers.binsearchInsert(occurences, searchEnd, cmpFunc);

    const results = [];
    for (let i = startIdx; i < endIdx; ++i) {
        const value = occurences[i];
        if (isInInterval(value, value + eventDurationMs, searchStart, searchEnd)) {
            results.push(value);
        }
    }

    return results;
};
