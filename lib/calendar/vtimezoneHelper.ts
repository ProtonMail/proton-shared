import isTruthy from '../helpers/isTruthy';
import { GetVTimezonesMap, SimpleMap } from '../interfaces';
import { VcalVeventComponent } from '../interfaces/calendar';
import { getPropertyTzid } from './vcalHelper';

export const getUniqueVtimezones = async (vevents: VcalVeventComponent[], getVtimezones: GetVTimezonesMap) => {
    const uniqueTzidsMap = vevents.reduce<SimpleMap<boolean>>((acc, { dtstart, dtend }) => {
        const startTzid = getPropertyTzid(dtstart);
        if (startTzid) {
            acc[startTzid] = true;
        }
        const endTzid = dtend ? getPropertyTzid(dtend) : undefined;
        if (endTzid) {
            acc[endTzid] = true;
        }
        return acc;
    }, {});
    const vtimezoneObjects = Object.values(await getVtimezones(Object.keys(uniqueTzidsMap))).filter(isTruthy);
    return vtimezoneObjects.map(({ vtimezone }) => vtimezone);
};
