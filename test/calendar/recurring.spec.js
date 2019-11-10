import { getOccurencesBetween, getOccurencesUntil } from '../../lib/calendar/recurring';

describe('recurring', () => {
    const component = {
        dtstart: {
            value: { year: 2019, month: 3, day: 30, hours: 2, minutes: 30, seconds: 0, isUTC: false },
            parameters: {
                type: 'date-time',
                tzid: 'Europe/Zurich'
            }
        },
        rrule: {
            value: {
                freq: 'DAILY',
                count: 10
            }
        }
    };

    it('should not get occurrences if it is out of range', () => {
        const result = getOccurencesUntil(component, new Date(Date.UTC(2018, 3, 1)));
        expect(result).toBeUndefined();
    });

    it('should get occurrences until', () => {
        const result = getOccurencesUntil(component, new Date(Date.UTC(2019, 3, 1, 3)));

        expect(result.map((start) => new Date(start).toISOString())).toEqual([
            '2019-03-30T02:30:00.000Z',
            '2019-03-31T02:30:00.000Z',
            '2019-04-01T02:30:00.000Z',
            '2019-04-02T02:30:00.000Z'
        ]);
    });

    it('should get occurrences between', () => {
        const start = new Date(Date.UTC(2019, 3, 1, 0));
        const end = new Date(Date.UTC(2019, 3, 2, 0));
        const occurrences = getOccurencesUntil(component, end);

        expect(
            getOccurencesBetween(occurrences, 30 * 60000, start, end).map((start) => new Date(start).toISOString())
        ).toEqual(['2019-04-01T02:30:00.000Z']);

        expect(
            getOccurencesBetween(occurrences, 1440 * 60000, start, end).map((start) => new Date(start).toISOString())
        ).toEqual(['2019-03-31T02:30:00.000Z', '2019-04-01T02:30:00.000Z']);
    });
});
