import { listTimeZones, findTimeZone, getZonedTime } from 'timezone-support';

export const toLocalDate = ({ year = 0, month = 1, day = 0, hours = 0, minutes = 0, seconds = 0 }) => {
    return new Date(year, month - 1, day, hours, minutes, seconds);
};

export const toUTCDate = ({ year = 0, month = 1, day = 0, hours = 0, minutes = 0, seconds = 0 }) => {
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
};

export const fromLocalDate = (date) => {
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds()
    };
};

export const fromUTCDate = (date) => {
    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hours: date.getUTCHours(),
        minutes: date.getUTCMinutes(),
        seconds: date.getUTCSeconds()
    };
};

/**
 * Get current timezone by using Intl
 * if not available use timezone-support lib and pick the first timezone from the current date timezone offset
 * @returns {String}
 */
export const getTimezone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
        const date = new Date();
        const timezoneOffset = date.getTimezoneOffset();
        const timezones = listTimeZones();
        return timezones.find((tz) => {
            const { zone = {} } = getZonedTime(date, findTimeZone(tz));
            return zone.offset === timezoneOffset;
        });
    }
};

const findUTCTransitionIndex = ({ unixTime, untils }) => {
    const max = untils.length - 1;
    for (let i = 0; i < max; i++) {
        if (unixTime < untils[i]) {
            return i;
        }
    }
    return max;
};

const findZoneTransitionIndex = ({
    unixTime,
    untils,
    offsets,
    moveAmbigiousForward = false,
    moveInvalidForward = false
}) => {
    const max = untils.length - 1;

    for (let i = 0; i < max; i++) {
        const offsetNext = offsets[i + 1];
        const offsetPrev = offsets[i ? i - 1 : i];

        let offset = offsets[i];
        if (offset < offsetNext && moveAmbigiousForward) {
            offset = offsetNext;
        } else if (offset > offsetPrev && moveInvalidForward) {
            offset = offsetPrev;
        }

        if (unixTime < untils[i] - offset * 60000) {
            return i;
        }
    }

    return max;
};

export const convertZonedDateTimeToUTC = (dateTime, tzid) => {
    const timezone = findTimeZone(tzid);
    const unixTime = Date.UTC(dateTime.year, dateTime.month - 1, dateTime.day, dateTime.hours, dateTime.minutes, 0);
    const idx = findZoneTransitionIndex({
        unixTime,
        untils: timezone.untils,
        offsets: timezone.offsets
    });
    const offset = timezone.offsets[idx];
    const date = new Date(unixTime + offset * 60000);
    return fromUTCDate(date);
};

export const convertUTCDateTimeToZone = (dateTime, tzid) => {
    const timezone = findTimeZone(tzid);
    const unixTime = Date.UTC(dateTime.year, dateTime.month - 1, dateTime.day, dateTime.hours, dateTime.minutes, 0);
    const idx = findUTCTransitionIndex({
        unixTime,
        untils: timezone.untils
    });
    const offset = timezone.offsets[idx];
    const date = new Date(unixTime - offset * 60000);
    return fromUTCDate(date);
};
