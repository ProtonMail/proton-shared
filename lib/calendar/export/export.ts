import { CalendarEventsQuery, queryEvents } from '../../api/calendars';
import { wait } from '../../helpers/promise';
import { Address, Api } from '../../interfaces';
import { CalendarEvent, VcalVeventComponent } from '../../interfaces/calendar';
import { splitKeys } from '../../keys';
import { getAuthorPublicKeysMap, withNormalizedAuthors } from '../author';
import { readCalendarEvent, readSessionKeys } from '../deserialize';

interface ProcessData {
    calendarID: string;
    addresses: Address[];
    getAddressKeys: Function;
    getEncryptionPreferences: Function;
    getCalendarKeys: Function;
    api: Api;
    signal: AbortSignal;
    onProgress: (veventComponents: VcalVeventComponent[]) => void;
    totalToProcess: number;
}

export const processInBatches = async ({
    calendarID,
    api,
    signal,
    onProgress,
    addresses,
    getAddressKeys,
    getEncryptionPreferences,
    getCalendarKeys,
    totalToProcess,
}: ProcessData): Promise<[VcalVeventComponent[], CalendarEvent[]]> => {
    const PAGE_SIZE = 10;
    const DELAY = 100;
    const batchesLength = Math.ceil(totalToProcess / PAGE_SIZE);
    const processed: VcalVeventComponent[] = [];
    const errored: CalendarEvent[] = [];
    const promises: Promise<void>[] = [];

    let lastId;

    const decryptEvent = async (event: CalendarEvent) => {
        try {
            const [calendarKeys, publicKeysMap] = await Promise.all([
                getCalendarKeys(event.CalendarID),
                getAuthorPublicKeysMap({
                    event,
                    addresses,
                    getAddressKeys,
                    getEncryptionPreferences,
                }),
            ]);

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

            processed.push(veventComponent);

            return veventComponent;
        } catch (error) {
            errored.push(event);

            return null;
        }
    };

    for (let i = 0; i < batchesLength; i++) {
        if (signal.aborted) {
            return [[], []];
        }

        const params: CalendarEventsQuery = {
            PageSize: PAGE_SIZE,
            BeginID: lastId,
        };

        const [result] = await Promise.all([
            api<{ Events: CalendarEvent[] }>(queryEvents(calendarID, params)),
            wait(DELAY),
        ]);

        if (signal.aborted) {
            return [[], []];
        }

        lastId = result.Events[result.Events.length - 1].ID;

        const promise = Promise.all(result.Events.map(decryptEvent)).then((veventComponents) => {
            onProgress(
                veventComponents.filter((veventComponent): veventComponent is VcalVeventComponent => !!veventComponent)
            );
        });

        promises.push(promise);
    }

    await Promise.all(promises);

    return [processed, errored];
};
