import { binaryStringToArray, unsafeSHA1, arrayToHexString } from 'pmcrypto';
import { Attendee } from '../interfaces/calendar';
import { VcalAttendeeProperty, VcalVeventComponent } from '../interfaces/calendar/VcalModel';
import { ATTENDEE_STATUS_API, ICAL_ATTENDEE_STATUS, ATTENDEE_PERMISSIONS } from './constants';
import { normalizeEmailForToken } from './calendar';

export const generateAttendeeToken = async (email: string, uid: string) => {
    const uidEmail = uid + normalizeEmailForToken(email);
    const byteArray = binaryStringToArray(uidEmail);
    const hash = await unsafeSHA1(byteArray);
    return arrayToHexString(hash);
};

const toApiPartstat = (partstat?: string) => {
    if (partstat === ICAL_ATTENDEE_STATUS.TENTATIVE) {
        return ATTENDEE_STATUS_API.TENTATIVE;
    }
    if (partstat === ICAL_ATTENDEE_STATUS.ACCEPTED) {
        return ATTENDEE_STATUS_API.ACCEPTED;
    }
    if (partstat === ICAL_ATTENDEE_STATUS.DECLINED) {
        return ATTENDEE_STATUS_API.DECLINED;
    }
    return ATTENDEE_STATUS_API.NEEDS_ACTION;
};

const toIcsPartstat = (partstat?: ATTENDEE_STATUS_API) => {
    if (partstat === ATTENDEE_STATUS_API.TENTATIVE) {
        return ICAL_ATTENDEE_STATUS.TENTATIVE;
    }
    if (partstat === ATTENDEE_STATUS_API.ACCEPTED) {
        return ICAL_ATTENDEE_STATUS.ACCEPTED;
    }
    if (partstat === ATTENDEE_STATUS_API.DECLINED) {
        return ICAL_ATTENDEE_STATUS.DECLINED;
    }
    return ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
};

/**
 * Internally permissions are stored as x-pm-permissions in the vevent,
 * but stripped for the api.
 */
export const fromInternalAttendee = async (
    {
        parameters: {
            'x-pm-permissions': oldPermissions = ATTENDEE_PERMISSIONS.SEE_AND_INVITE,
            'x-pm-token': oldToken = '',
            partstat,
            ...restParameters
        } = {},
        ...rest
    }: VcalAttendeeProperty,
    component: VcalVeventComponent
) => {
    if (restParameters.cn === undefined) {
        throw new Error('Attendee information error');
    }
    const token = oldToken || (await generateAttendeeToken(restParameters.cn, component.uid.value));
    return {
        attendee: {
            parameters: {
                ...restParameters,
                'x-pm-token': token,
            },
            ...rest,
        },
        clear: {
            permissions: oldPermissions,
            token,
            status: toApiPartstat(partstat),
        },
    };
};

export const toInternalAttendee = (
    { attendee: attendees = [] }: Pick<VcalVeventComponent, 'attendee'>,
    clear: Attendee[] = []
): VcalAttendeeProperty[] => {
    return attendees.map((attendee) => {
        if (!attendee.parameters) {
            return attendee;
        }
        const token = attendee.parameters['x-pm-token'];
        const extra = clear.find(({ Token }) => Token === token);
        if (!token || !extra) {
            return attendee;
        }
        const partstat = toIcsPartstat(extra.Status);
        return {
            ...attendee,
            parameters: {
                ...attendee.parameters,
                partstat,
                'x-pm-permissions': extra.Permissions,
            },
        };
    });
};
