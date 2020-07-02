export enum CALENDAR_CARD_TYPE {
    ENCRYPTED_AND_SIGNED = 3,
    SIGNED = 2,
    CLEAR = 1,
}

export enum ATTENDEE_PERMISSIONS {
    SEE = 1,
    INVITE = 2,
    EDIT = 4,
    DELETE = 8,
}

export enum CALENDAR_PERMISSIONS {
    OWNER = 32,
    ADMIN = 16,
    WRITE = 8,
    READ_MEMBER_LIST = 4,
    READ = 2,
    AVAILABILITY = 1,
}

export enum CALENDAR_FLAGS {
    INACTIVE = 0,
    ACTIVE = 1,
    UPDATE_PASSPHRASE = 2,
    RESET_NEEDED = 4,
    INCOMPLETE_SETUP = 8,
    LOST_ACCESS = 16,
    SELF_DISABLED = 32,
    SUPER_OWNER_DISABLED = 64,
}

export enum ICAL_METHOD {
    REQUEST = 'REQUEST',
    REPLY = 'REPLY',
    CANCEL = 'CANCEL',
    DECLINECOUNTER = 'DECLINECOUNTER',
    REFRESH = 'REFRESH',
    COUNTER = 'COUNTER'
}

export enum EVENT_STATUS {
    TENTATIVE = 'TENTATIVE',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED'
}

export enum PARTICIPANT_ROLE {
    REQUIRED = 'REQ-PARTICIPANT', // Indicates a participant whose participation is required
    OPTIONAL = 'OPT-PARTICIPANT', // Indicates a participant whose participation is optional
    NON = 'NON-PARTICIPANT' // Indicates a participant who is copied for information purposes only
}

export enum PARTICIPANT_STATUS {
    NEEDS_ACTION = 'NEEDS-ACTION',
    ACCEPTED = 'ACCEPTED',
    DECLINED = 'DECLINED',
    TENTATIVE = 'TENTATIVE',
    DELEGATED = 'DELEGATED'
}

export const MAX_LENGTHS = {
    UID: 191,
    CALENDAR_NAME: 100,
    CALENDAR_DESCRIPTION: 255,
    TITLE: 255,
    EVENT_DESCRIPTION: 3000,
    LOCATION: 255
};

export const MINIMUM_DATE = new Date(1970, 0, 1);
export const MINIMUM_DATE_UTC = new Date(
    Date.UTC(MINIMUM_DATE.getFullYear(), MINIMUM_DATE.getMonth(), MINIMUM_DATE.getDate())
);
export const MAXIMUM_DATE = new Date(2037, 11, 31);
export const MAXIMUM_DATE_UTC = new Date(
    Date.UTC(MAXIMUM_DATE.getFullYear(), MAXIMUM_DATE.getMonth(), MAXIMUM_DATE.getDate())
);
