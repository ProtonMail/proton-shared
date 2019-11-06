import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDate,
    toLocalDate,
    toUTCDate
} from '../date/timezone';

export const dateToProperty = ({ year, month = 1, day = 1 }) => {
    // All day date properties are always floating time
    return {
        value: { year, month, day },
        parameters: { type: 'date' }
    };
};

export const dateTimeToProperty = ({
    year,
    month = 1,
    day = 1,
    hours = 0,
    minutes = 0,
    seconds = 0,
    isUTC = false,
    tzid
}) => {
    const parameters = tzid ? { tzid } : undefined;
    return {
        value: { year, month, day, hours, minutes, seconds, isUTC },
        parameters: {
            type: 'date-time',
            ...parameters
        }
    };
};

export const getDateProperty = ({ year, month, day }) => {
    return dateToProperty({ year, month, day });
};

export const getDateTimeProperty = (zonelessTime, specificTzid, tzid) => {
    /**
     * If no specific timezone is wanted, convert the zoneless time
     * into the current timezone (of the calendar) being used. Then convert
     * the zoned time into UTC time.
     */
    if (!specificTzid) {
        const utcZonedTime = convertZonedDateTimeToUTC(zonelessTime, tzid);
        return dateTimeToProperty({
            ...utcZonedTime,
            isUTC: true
        });
    }
    /**
     * If a specific timezone is wanted, the zoneless time is already relative
     * to the specific timezone so we can store it as-is.
     */
    return dateTimeToProperty({
        ...zonelessTime,
        isUTC: false,
        tzid: specificTzid
    });
};

export const isIcalPropertyAllDay = ({ parameters }) => {
    return parameters ? parameters.type === 'date' : false;
};

/**
 * Returns a date object that is relative to the user's system.
 * @param {Object} value
 * @param {Object} parameters
 * @param tzid - Timezone of the calendar
 * @return {{date: *, tzid: *}}
 */
export const propertyToLocalDate = ({ value, parameters = {} }) => {
    if (value.isUTC) {
        return toUTCDate(value);
    }

    // All day events are always floating, can convert them directly to a local date
    if (parameters.type === 'date') {
        return toLocalDate(value);
    }

    // For dates with a timezone, convert the relative date time to UTC time
    return toUTCDate(convertZonedDateTimeToUTC(value, parameters.tzid));
};

export const getTzid = ({ parameters: { tzid } = {} }) => tzid;
