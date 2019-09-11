const TIME_FORMAT_LOCALES = {
    12: 'en_US',
    24: 'en_GB'
};

const DATE_FORMAT_LOCALES = {
    MMDDYYYY: 'en_US',
    DDMMYYYY: 'en_GB',
    YYYYMMDD: 'en_CA'
};

export const loadDateFnLocale = async ({ locale, longLocale, locales, timeFormat, dateFormat }) => {
    const dateFormatLocaleString = DATE_FORMAT_LOCALES[dateFormat];
    const timeFormatLocaleString = TIME_FORMAT_LOCALES[timeFormat];

    const [appDateFnLocale, longDateFnLocale, dateFormatLocale, timeFormatLocale] = await Promise.all([
        locales[locale](),
        dateFormatLocaleString && timeFormatLocaleString ? undefined : locales[longLocale](),
        dateFormatLocaleString ? locales[dateFormatLocaleString]() : undefined,
        timeFormatLocaleString ? locales[timeFormatLocaleString]() : undefined
    ]);

    /**
     * By default we use the same date-time locale as the user has selected in the app in order
     * to get the correct translations for days, months, year, etc. However, we override
     * the long date and time format to get 12 or 24 hour time and the correct date format depending
     * on what is selected in the browser since there is no settings for this in the mail application.
     * However in the calendar application there is a setting for this, so allow it to be overridden.
     */
    return {
        ...appDateFnLocale,
        formatLong: {
            ...appDateFnLocale.formatLong,
            date: (dateFormatLocale || longDateFnLocale).formatLong.date,
            time: (timeFormatLocale || longDateFnLocale).formatLong.time
        }
    };
};
