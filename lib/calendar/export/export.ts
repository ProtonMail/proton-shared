import { c } from 'ttag';
import { getMatchingKey, getSignature, OpenPGPKey } from 'pmcrypto';
import { fromUnixTime } from 'date-fns';
import { CalendarExportEventsQuery, queryEvents } from '../../api/calendars';
import { wait } from '../../helpers/promise';
import { Address, Api, DecryptedKey } from '../../interfaces';
import {
    CalendarEvent,
    CalendarEventWithMetadata,
    EXPORT_EVENT_ERROR_TYPES,
    ExportError,
    VcalVeventComponent,
} from '../../interfaces/calendar';
import { GetCalendarKeys } from '../../interfaces/hooks/GetCalendarKeys';
import { GetEncryptionPreferences } from '../../interfaces/hooks/GetEncryptionPreferences';
import { splitKeys } from '../../keys';
import { getAuthorPublicKeysMap, withNormalizedAuthors } from '../author';
import { readCalendarEvent, readSessionKeys } from '../deserialize';
import isTruthy from '../../helpers/isTruthy';
import { fromRruleString } from '../vcal';
import { getTimezonedFrequencyString } from '../integration/getFrequencyString';
import { getDateProperty } from '../vcalConverter';
import {
    convertUTCDateTimeToZone,
    formatTimezoneOffset,
    fromUTCDate,
    getTimezoneOffset,
    toUTCDate,
} from '../../date/timezone';
import { dateLocale } from '../../i18n';
import { WeekStartsOn } from '../../date-fns-utc/interface';
import useGetCalendarEventPersonal from '../../../../react-components/hooks/useGetCalendarEventPersonal';
import { SECOND } from '../../constants';
import formatUTC from '../../date-fns-utc/format';

export const getCalendarEventMatchingSigningKeys = async (event: CalendarEvent, publicKeys: OpenPGPKey[]) => {
    const allEventSignatures = [
        ...event.SharedEvents,
        ...event.CalendarEvents,
        ...event.AttendeesEvents,
    ].flatMap((event) => (event.Signature ? [event.Signature] : []));

    return (
        await Promise.all(
            allEventSignatures.map(async (signature) => getMatchingKey(await getSignature(signature), publicKeys))
        )
    ).filter(isTruthy);
};

export interface GetErrorProps {
    event: CalendarEventWithMetadata;
    errorType: EXPORT_EVENT_ERROR_TYPES;
    weekStartsOn: WeekStartsOn;
    defaultTzid: string;
}

export const getError = ({ event, errorType, weekStartsOn, defaultTzid }: GetErrorProps): ExportError => {
    const { StartTime, RRule } = event;
    const startDate = new Date(StartTime * SECOND);
    const fakeUTCStartDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(startDate), defaultTzid));
    const startDateString = formatUTC(fakeUTCStartDate, 'Pp', { locale: dateLocale });
    const { offset } = getTimezoneOffset(startDate, defaultTzid);
    const offsetString = `GMT${formatTimezoneOffset(offset)}`;
    const timeString = `${startDateString} ${offsetString}`;

    const rruleValueFromString = RRule ? fromRruleString(RRule) : undefined;
    const utcStartDate = fromUnixTime(StartTime);
    const dtstart = getDateProperty(fromUTCDate(utcStartDate));

    if (rruleValueFromString) {
        const rruleString = getTimezonedFrequencyString({ value: rruleValueFromString }, dtstart, {
            currentTzid: defaultTzid,
            locale: dateLocale,
            weekStartsOn,
        });

        return [c('Error when exporting event from calendar').t`Event from ${timeString}, ${rruleString}`, errorType];
    }

    return [c('Error when exporting event from calendar').t`Event @ ${timeString}`, errorType];
};

const getDecryptionErrorType = async (event: CalendarEventWithMetadata, publicKeys: OpenPGPKey[]) => {
    try {
        const matchingKeys = await getCalendarEventMatchingSigningKeys(event, publicKeys);
        if (matchingKeys.length) {
            return EXPORT_EVENT_ERROR_TYPES.PASSWORD_RESET;
        }
        return EXPORT_EVENT_ERROR_TYPES.DECRYPTION_ERROR;
    } catch {
        return EXPORT_EVENT_ERROR_TYPES.DECRYPTION_ERROR;
    }
};

interface ProcessData {
    calendarID: string;
    addresses: Address[];
    getAddressKeys: (id: string) => Promise<DecryptedKey[]>;
    getEncryptionPreferences: GetEncryptionPreferences;
    getCalendarKeys: GetCalendarKeys;
    getCalendarEventPersonal: ReturnType<typeof useGetCalendarEventPersonal>;
    api: Api;
    signal: AbortSignal;
    onProgress: (veventComponents: VcalVeventComponent[]) => void;
    totalToProcess: number;
    memberID: string;
    weekStartsOn: WeekStartsOn;
    defaultTzid: string;
}

export const processInBatches = async ({
    calendarID,
    api,
    signal,
    onProgress,
    addresses,
    getAddressKeys,
    getEncryptionPreferences,
    getCalendarEventPersonal,
    totalToProcess,
    memberID,
    getCalendarKeys,
    weekStartsOn,
    defaultTzid,
}: ProcessData): Promise<[VcalVeventComponent[], ExportError[], number]> => {
    const PAGE_SIZE = 10;
    const DELAY = 100;
    const batchesLength = Math.ceil(totalToProcess / PAGE_SIZE);
    const processed: VcalVeventComponent[] = [];
    const errors: ExportError[] = [];
    const promises: Promise<void>[] = [];
    let totalEventsFetched = 0;

    let lastId;

    const decryptEvent = async (event: CalendarEventWithMetadata) => {
        const defaultParams = { event, defaultTzid, weekStartsOn };
        const [calendarKeys, publicKeysMap, eventPersonalMap] = await Promise.all([
            getCalendarKeys(event.CalendarID),
            getAuthorPublicKeysMap({
                event,
                addresses,
                getAddressKeys,
                getEncryptionPreferences,
            }),
            getCalendarEventPersonal(event),
        ]);

        try {
            const personalVevent = memberID ? eventPersonalMap[memberID] : undefined;
            const valarms = personalVevent ? personalVevent.veventComponent : {};

            const [sharedSessionKey, calendarSessionKey] = await readSessionKeys({
                calendarEvent: event,
                ...splitKeys(calendarKeys),
            });

            const { veventComponent } = await readCalendarEvent({
                isOrganizer: !!event.IsOrganizer,
                event: {
                    SharedEvents: withNormalizedAuthors(event.SharedEvents),
                    CalendarEvents: withNormalizedAuthors(event.CalendarEvents),
                    AttendeesEvents: withNormalizedAuthors(event.AttendeesEvents),
                    Attendees: event.Attendees,
                },
                sharedSessionKey,
                calendarSessionKey,
                publicKeysMap,
                addresses,
            });
            const veventWithAlarms = {
                ...valarms,
                ...veventComponent,
            };

            processed.push(veventWithAlarms);

            return veventWithAlarms;
        } catch (error) {
            const publicKeys = Object.values(publicKeysMap)
                .filter(isTruthy)
                .flatMap((keys) => (Array.isArray(keys) ? keys : [keys]));
            errors.push(getError({ ...defaultParams, errorType: await getDecryptionErrorType(event, publicKeys) }));

            return null;
        }
    };

    for (let i = 0; i < batchesLength; i++) {
        if (signal.aborted) {
            return [[], [], totalToProcess];
        }

        const params: CalendarExportEventsQuery = {
            PageSize: PAGE_SIZE,
            BeginID: lastId,
        };

        const [{ Events }] = await Promise.all([
            api<{ Events: CalendarEventWithMetadata[] }>(queryEvents(calendarID, params)),
            wait(DELAY),
        ]);

        if (signal.aborted) {
            return [[], [], totalToProcess];
        }

        const { length: eventsLength } = Events;

        lastId = Events[eventsLength - 1].ID;

        totalEventsFetched += eventsLength;

        const promise = Promise.all(Events.map(decryptEvent)).then((veventComponents) => {
            onProgress(
                veventComponents.filter((veventComponent): veventComponent is VcalVeventComponent => !!veventComponent)
            );
        });

        promises.push(promise);
    }

    await Promise.all(promises);

    return [processed, errors, totalEventsFetched];
};
