import { generateAttendeeToken } from '../../lib/calendar/attendees';

const expectedToken = 'c2d3d0b4eb4ef80633f9cc7755991e79ca033016';

describe('generateAttendeeToken()', () => {
    it('should produce correct tokens', async () => {
        let token;
        token = await generateAttendeeToken('james@mi6.org', 'uid@proton.me');
        expect(token).toBe(expectedToken);
        token = await generateAttendeeToken('JamEs@mi6.org', 'uid@proton.me');
        expect(token).toBe(expectedToken);
        token = await generateAttendeeToken('james+shouldberemoved@mi6.org', 'uid@proton.me');
        expect(token).toBe(expectedToken);
        token = await generateAttendeeToken('james+shouldberemoved+alsoremoved@mi6.org', 'uid@proton.me');
        expect(token).toBe(expectedToken);
        token = await generateAttendeeToken('j.a.m.e.s@mi6.org', 'uid@proton.me');
        expect(token).toBe(expectedToken);
        token = await generateAttendeeToken('j_a_m_e_s@mi6.org', 'uid@proton.me');
        expect(token).toBe(expectedToken);
        token = await generateAttendeeToken('j-a-m-e-s@mi6.org', 'uid@proton.me');
        expect(token).toBe(expectedToken);
    });
});
