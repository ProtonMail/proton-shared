import { OpenPGPKey } from 'pmcrypto';
import { CalendarEvent, CalendarEventData, VcalVeventComponent } from '../interfaces/calendar';
import { CalendarEventsQuery, queryEvents } from '../api/calendars';
import { wait } from '../helpers/promise';
import { Address, Api } from '../interfaces';
import { readCalendarEvent, readSessionKeys } from './deserialize';
import { canonizeInternalEmail } from '../helpers/email';
import { SimpleMap } from '../interfaces/utils';
import { unique } from '../helpers/array';
import isTruthy from '../helpers/isTruthy';
import { splitKeys } from '../keys';
import { CALENDAR_CARD_TYPE } from './constants';

const { SIGNED, ENCRYPTED_AND_SIGNED } = CALENDAR_CARD_TYPE;

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

// TODO: Move to shared
const withNormalizedAuthor = (x: CalendarEventData) => ({
    ...x,
    Author: canonizeInternalEmail(x.Author),
});

const withNormalizedAuthors = (x: CalendarEventData[]) => {
    if (!x) {
        return [];
    }
    return x.map(withNormalizedAuthor);
};

interface GetAuthorPublicKeysMap {
    event: CalendarEvent;
    addresses: Address[];
    getAddressKeys: Function;
    getEncryptionPreferences: Function;
}

const getAuthorPublicKeysMap = async ({
    event,
    addresses,
    getAddressKeys,
    getEncryptionPreferences,
}: GetAuthorPublicKeysMap) => {
    const publicKeysMap: SimpleMap<OpenPGPKey | OpenPGPKey[]> = {};
    const authors = unique(
        [...event.SharedEvents, ...event.CalendarEvents]
            .map(({ Author, Type }) => {
                if (![SIGNED, ENCRYPTED_AND_SIGNED].includes(Type)) {
                    // no need to fetch keys in this case
                    return;
                }
                return canonizeInternalEmail(Author);
            })
            .filter(isTruthy)
    );
    const normalizedAddresses = addresses.map((address) => ({
        ...address,
        normalizedEmailAddress: canonizeInternalEmail(address.Email),
    }));
    const promises = authors.map(async (author) => {
        const ownAddress = normalizedAddresses.find(({ normalizedEmailAddress }) => normalizedEmailAddress === author);
        if (ownAddress) {
            const result = await getAddressKeys(ownAddress.ID);
            publicKeysMap[author] = splitKeys(result).publicKeys;
        } else {
            const { pinnedKeys } = await getEncryptionPreferences(author);
            publicKeysMap[author] = pinnedKeys;
        }
    });
    await Promise.all(promises);

    return publicKeysMap;
};

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
        ]).catch(() => {
            throw new Error('Failed to fatch events');
        });

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
