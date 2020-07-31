import { APPS } from '../constants';

export const FORKABLE_APPS = {
    mail: APPS.PROTONMAIL,
    'mail-settings': APPS.PROTONMAIL_SETTINGS,
    contacts: APPS.PROTONCONTACTS,
    // drive: APPS.PROTONDRIVE,
    calendar: APPS.PROTONCALENDAR,
} as const;
