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
