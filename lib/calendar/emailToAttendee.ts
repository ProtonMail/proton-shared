import { AttendeeModel } from '../interfaces/calendar';
import { ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_RSVP, ICAL_ATTENDEE_STATUS } from './constants';

const { REQUIRED } = ICAL_ATTENDEE_ROLE;
const { TRUE } = ICAL_ATTENDEE_RSVP;
const { NEEDS_ACTION } = ICAL_ATTENDEE_STATUS;

const emailToAttendee = (email: string): AttendeeModel => ({
    email,
    cn: email,
    role: REQUIRED,
    partstat: NEEDS_ACTION,
    rsvp: TRUE,
});

export default emailToAttendee;
