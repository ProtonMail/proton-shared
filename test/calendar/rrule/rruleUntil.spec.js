import { getDateProperty, getDateTimeProperty } from '../../../lib/calendar/vcalConverter';
import { fromLocalDate } from '../../../lib/date/timezone';
import { FREQUENCY } from '../../../lib/calendar/constants';
import { withRruleUntil } from '../../../lib/calendar/rruleUntil';

const getTest = (name, rruleValue, dtstart, result) => ({
    name,
    rruleValue,
    dtstart,
    result,
});

const getUntil = (date) => ({
    ...fromLocalDate(date),
    isUTC: true,
});

describe('rrule until', () => {
    [
        getTest(
            'ignore non-until',
            { freq: FREQUENCY.DAILY },
            getDateProperty({
                year: 2020,
                month: 1,
                day: 1,
            }),
            { freq: FREQUENCY.DAILY }
        ),
        getTest(
            'convert from a date-time until to date if start is all day',
            {
                freq: FREQUENCY.DAILY,
                until: getUntil(new Date(2020, 1, 10, 12, 59, 59)),
            },
            getDateProperty({ year: 2020, month: 1, day: 1 }),
            {
                freq: FREQUENCY.DAILY,
                until: { year: 2020, month: 2, day: 10 },
            }
        ),
        getTest(
            'convert from a date until to date-time if start is part-day',
            {
                freq: FREQUENCY.DAILY,
                until: { year: 2020, month: 2, day: 10 },
            },
            getDateTimeProperty({ year: 2020, month: 1, day: 1, hours: 6, minutes: 12 }, 'Europe/Zurich'),
            {
                freq: FREQUENCY.DAILY,
                until: getUntil(new Date(2020, 1, 10, 22, 59, 59)),
            }
        ),
        getTest(
            'convert date-time timezone if start is part-day',
            {
                freq: FREQUENCY.DAILY,
                until: getUntil(new Date(2020, 1, 10, 22, 59, 59)),
            },
            getDateTimeProperty({ year: 2020, month: 1, day: 1, hours: 6, minutes: 12 }, 'UTC'),
            {
                freq: FREQUENCY.DAILY,
                until: getUntil(new Date(2020, 1, 10, 23, 59, 59)),
            }
        ),
        getTest(
            'correct until that is not at the end of the day if needed',
            {
                freq: FREQUENCY.DAILY,
                until: getUntil(new Date(2020, 1, 10, 12, 30, 0)),
            },
            getDateTimeProperty({ year: 2020, month: 1, day: 1, hours: 18, minutes: 12 }, 'UTC'),
            {
                freq: FREQUENCY.DAILY,
                until: getUntil(new Date(2020, 1, 9, 23, 59, 59)),
            }
        ),
        getTest(
            'not correct until that is not at the end of the day if not needed',
            {
                freq: FREQUENCY.DAILY,
                until: getUntil(new Date(2020, 1, 10, 12, 30, 0)),
            },
            getDateTimeProperty({ year: 2020, month: 1, day: 1, hours: 10, minutes: 12 }, 'UTC'),
            {
                freq: FREQUENCY.DAILY,
                until: getUntil(new Date(2020, 1, 10, 23, 59, 59)),
            }
        ),
    ].forEach(({ name, rruleValue, dtstart, result }) => {
        test(name, () => {
            expect(withRruleUntil({ value: rruleValue }, dtstart)).toEqual({ value: result });
        });
    });
});
