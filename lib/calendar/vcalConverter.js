import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
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
     * into the current timezone (of the calendar). Then convert
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
 * Returns a date object relative to the system timezone.
 * @param {Object} value
 * @param {Object} parameters
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

/**
 * Returns a the date object relative to the system timezone, ignoring the timezone.
 * @param {Object} value
 * @param {Object} parameters
 * @param {String} tzid
 * @return {Date}
 */
export const propertyToLocalRelativeTime = ({ value, parameters = {} }, tzid) => {
    // If it's a date in utc time, it must be converted to local time
    if (value.isUTC) {
        return toLocalDate(convertUTCDateTimeToZone(value, tzid));
    }
    // If it's a date-type, the date can be directly created
    if (parameters.type === 'date') {
        return toLocalDate(value);
    }
    // If it's not a utc date or date type, then a timezone is created, so we can directly create the local time
    return toLocalDate(value);
};

export const getTzid = ({ parameters: { tzid } = {} }) => tzid;

