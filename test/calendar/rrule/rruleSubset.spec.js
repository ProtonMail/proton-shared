import { FREQUENCY } from '../../../lib/calendar/constants';
import { getIsRruleSubset } from '../../../lib/calendar/rruleSubset';

const getTest = (a, b, result) => ({
    a,
    b,
    result,
});

describe('rrule subset', () => {
    const dummyVevent = {
        dtstart: {
            value: { year: 2021, month: 1, day: 6, hours: 12, minutes: 0, seconds: 0, isUTC: false },
            parameters: { tzid: 'America/New_York' },
        },
    };
    [
        getTest(
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY, count: 10 } } },
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY } } },
            true
        ),
        getTest(
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY } } },
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY, count: 10 } } },
            false
        ),
    ].forEach(({ a, b, result }, i) => {
        it(`is rrule subset for ${i}`, () => {
            expect(getIsRruleSubset(a, b)).toEqual(result);
        });
    });
});
