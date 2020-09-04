import { binaryStringToArray, unsafeSHA1, arrayToHexString } from 'pmcrypto';
import { Attendee, GetCanonicalAddressesResponse } from '../interfaces/calendar';
import { VcalAttendeeProperty, VcalVeventComponent } from '../interfaces/calendar/VcalModel';
import { ATTENDEE_STATUS_API, ICAL_ATTENDEE_STATUS, ATTENDEE_PERMISSIONS } from './constants';
import { getCanonicalAddresses } from '../api/addresses';
import { Api } from '../interfaces';

export const generateAttendeeToken = async (normalizedEmail: string, uid: string) => {
    const uidEmail = `${uid}${normalizedEmail}`;
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
export const fromInternalAttendee = ({
    parameters: {
        'x-pm-permissions': oldPermissions = ATTENDEE_PERMISSIONS.SEE_AND_INVITE,
        'x-pm-token': token = '',
        partstat,
        ...restParameters
    } = {},
    ...rest
}: VcalAttendeeProperty) => {
    if (restParameters.cn === undefined) {
        throw new Error('Attendee information error');
    }
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

export const withAttendeeTokens = async ({
    attendees,
    api,
    uid,
}: {
    attendees: VcalAttendeeProperty[];
    uid: string;
    api: Api;
}) => {
    const attendeeEmails = attendees.map(({ parameters }) => parameters?.cn!);
    if (uid && attendeeEmails.length) {
        const { Responses } = await api<GetCanonicalAddressesResponse>(getCanonicalAddresses(attendeeEmails));
        const emailMap = Object.fromEntries(
            Responses.map(({ Email, Response: { CanonicalEmail } }) => [Email, CanonicalEmail])
        );
        return Promise.all(
            attendees.map(async (attendee) => {
                if (attendee.parameters && attendee.parameters.cn && !attendee.parameters?.['x-pm-token']) {
                    attendee.parameters['x-pm-token'] = await generateAttendeeToken(
                        emailMap[attendee.parameters.cn],
                        uid
                    );
                }
                return attendee;
            })
        );
    }
    return [];
};
