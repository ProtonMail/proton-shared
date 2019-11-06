import { decryptPrivateKey } from 'pmcrypto';
import { createCalendarEvent } from '../../lib/calendar/serialize';
import { readCalendarEvent, readSessionKeys } from '../../lib/calendar/deserialize';
import { DecryptableKey } from '../keys/keys.data';
import { unwrap, wrap } from '../../lib/calendar/helper';

const veventComponent = {
    component: 'vevent',
    components: [
        {
            component: 'valarm',
            trigger: {
                value: { weeks: 0, days: 0, hours: 15, minutes: 0, seconds: 0, isNegative: true }
            }
        }
    ],
    uid: { value: '123' },
    dtstart: {
        value: { year: 2019, month: 12, day: 11, hours: 12, minutes: 12, seconds: 12, isUTC: true }
    },
    dtend: {
        value: { year: 2019, month: 12, day: 12, hours: 12, minutes: 12, seconds: 12, isUTC: true }
    },
    summary: { value: 'my title' },
    comment: [{ value: 'asdasd' }],
    attendee: [
        {
            value: 'mailto:james@bond.co.uk',
            parameters: {
                cutype: 'INDIVIDUAL',
                role: 'REQ-PARTICIPANT',
                rsvp: 'TRUE',
                'x-pm-token': 'abc',
                'x-pm-permissions': 1,
                cn: 'james@bond.co.uk'
            }
        },
        {
            value: 'mailto:dr.no@mi6.co.uk',
            parameters: {
                cutype: 'INDIVIDUAL',
                role: 'REQ-PARTICIPANT',
                rsvp: 'TRUE',
                'x-pm-token': 'bcd',
                'x-pm-permissions': 1,
                cn: 'Dr No.'
            }
        },
        {
            value: 'mailto:moneypenny@mi6.co.uk',
            parameters: {
                cutype: 'INDIVIDUAL',
                role: 'NON-PARTICIPANT',
                rsvp: 'FALSE',
                cn: 'Miss Moneypenny',
                'x-pm-token': 'cde',
                'x-pm-permissions': 2
            }
        }
    ]
};

describe('calendar encryption', () => {
    it('should encrypt and sign calendar events', async () => {
        const primaryCalendarKey = await decryptPrivateKey(DecryptableKey.PrivateKey, '123');
        const data = await createCalendarEvent({
            eventComponent: veventComponent,
            privateKey: primaryCalendarKey,
            publicKey: primaryCalendarKey.toPublic(),
            signingKey: primaryCalendarKey // Should be an address key
        });
        expect(data).toEqual({
            SharedKeyPacket:
                'wV4DatuD4HBmK9ESAQdAh5aMHBZCvQYA9q2Gm4j5LJYj0N/ETwHe/+Icmt09yl8w81ByP+wHwvShTNdKZNv7ziSuGkYloQ9Y2hReRQR0Vdacz4LtBa2T3H17aBbI/rBs',
            SharedEventContent: [
                {
                    Type: 2,
                    Data: wrap(
                        'BEGIN:VEVENT\r\nUID:123\r\nDTSTART:20191211T121212Z\r\nDTEND:20191212T121212Z\r\nEND:VEVENT'
                    ),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/)
                },
                {
                    Type: 3,
                    Data: jasmine.stringMatching(/0pgB8pECtS5Mmdeh\+pBh0SN5j5TqWO.*/g),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g)
                }
            ],
            CalendarKeyPacket:
                'wV4DatuD4HBmK9ESAQdAh5aMHBZCvQYA9q2Gm4j5LJYj0N/ETwHe/+Icmt09yl8w81ByP+wHwvShTNdKZNv7ziSuGkYloQ9Y2hReRQR0Vdacz4LtBa2T3H17aBbI/rBs',
            CalendarEventContent: [
                {
                    Type: 3,
                    Data: jasmine.stringMatching(/0pYB8pECtS5Mmdeh\+pBh0SN5.*/g),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g)
                }
            ],
            PersonalEventContent: {
                Type: 2,
                Data: wrap('BEGIN:VEVENT\r\nUID:123\r\nBEGIN:VALARM\r\nTRIGGER:-PT15H\r\nEND:VALARM\r\nEND:VEVENT'),
                Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g)
            },
            AttendeesEventContent: {
                Type: 3,
                Data: jasmine.stringMatching(/0sErAfKRArUuTJnXofqQYdEjeY\+U6.*/g),
                Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g)
            },
            Attendees: [
                { Token: 'abc', Permissions: 1 },
                { Token: 'bcd', Permissions: 1 },
                { Token: 'cde', Permissions: 2 }
            ]
        });
    });

    it('should roundtrip', async () => {
        const primaryCalendarKey = await decryptPrivateKey(DecryptableKey.PrivateKey, '123');
        const publicKey = primaryCalendarKey.toPublic();

        const data = await createCalendarEvent({
            eventComponent: veventComponent,
            privateKey: primaryCalendarKey,
            publicKey,
            signingKey: primaryCalendarKey // Should be an address key
        });

        const [sharedSessionKey, calendarSessionKey] = await readSessionKeys(data, primaryCalendarKey);
        const otherVeventComponent = await readCalendarEvent(
            {
                ...data,
                // Not the same name for some reason
                SharedEvents: data.SharedEventContent,
                CalendarEvents: data.CalendarEventContent,
                AttendeesEvent: data.AttendeesEventContent
            },
            publicKey,
            { sharedSessionKey, calendarSessionKey }
        );

        expect(otherVeventComponent).toEqual(veventComponent);
    });
});

describe('wrapping', () => {
    it('should add wrapping', () => {
        expect(wrap('asd')).toEqual(`BEGIN:VCALENDAR
VERSION:2.0
asd
END:VCALENDAR`);
    });
    it('should remove wrapping', () => {
        expect(unwrap(wrap('BEGIN:VEVENT asd END:VEVENT'))).toEqual('BEGIN:VEVENT asd END:VEVENT');
    });
});
