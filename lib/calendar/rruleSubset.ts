import { toUTCDate } from '../date/timezone';
import { VcalVeventComponent } from '../interfaces/calendar';
import { FREQUENCY } from './constants';
import { getOccurrences, getOccurrencesBetween, RecurringResult } from './recurring';
import { getIsRruleEqual } from './rruleEqual';
import { propertyToUTCDate } from './vcalConverter';

export const getAreOccurrencesSubset = (
    newOccurrences: Pick<RecurringResult, 'localStart'>[],
    oldOccurrences: Pick<RecurringResult, 'localStart'>[]
) => {
    if (newOccurrences.length !== oldOccurrences.length) {
        return false;
    }
    return newOccurrences.reduce((acc, { localStart }, i) => {
        const oldOccurrence = oldOccurrences[i];
        if (acc === false || !oldOccurrence) {
            return false;
        }
        return +localStart === +oldOccurrence.localStart;
    }, true);
};

/**
 * Return true if the set of occurrences of the new rrule is contained (equality counts) in the old rrule.
 * Return false otherwise
 * We restrict to rrules that can be created by us
 */
export const getIsRruleSubset = (newVevent: VcalVeventComponent, oldVevent: VcalVeventComponent) => {
    const [{ rrule: newRrule, dtstart: newDtstart }, { rrule: oldRrule }] = [newVevent, oldVevent];
    const isRruleEqual = getIsRruleEqual(newRrule, oldRrule);
    if (!newRrule || !oldRrule || isRruleEqual) {
        return isRruleEqual;
    }
    const { freq: oldFreq, count: oldCount, until: oldUntil, byday: oldByday } = oldRrule.value;
    const { freq: newFreq, count: newCount, until: newUntil, byday: newByday } = newRrule.value;
    if (oldFreq !== newFreq) {
        // we always consider such rrules to be different, even if the generated new set is contained in the old set
        return false;
    }
    if (!newCount && !newUntil) {
        if (oldCount || oldUntil) {
            return false;
        }
        if (oldFreq === FREQUENCY.WEEKLY) {
            if (Array.isArray(oldByday)) {
                if (!newByday) {
                    return true;
                }
                const newBydayArray = Array.isArray(newByday) ? newByday : [newByday];
                return !newBydayArray.some((byday) => !oldByday.includes(byday));
            }
            if (Array.isArray(newByday)) {
                return newByday.length < 2;
            }
            return true;
        }
    }
    // either newUntil or newCount are not undefined
    const newOccurrences = newUntil
        ? getOccurrencesBetween(newVevent, +propertyToUTCDate(newDtstart), +toUTCDate(newUntil))
        : getOccurrences({ component: newVevent, maxCount: newCount });
    const oldOccurrences = newUntil
        ? getOccurrencesBetween(oldVevent, +propertyToUTCDate(newDtstart), +toUTCDate(newUntil))
        : getOccurrences({ component: oldVevent, maxCount: newCount });
    console.log({ newOccurrences, oldOccurrences });

    return getAreOccurrencesSubset(newOccurrences, oldOccurrences);
};
