export const TIME_FORMAT_LOCALES = {
    H12: 'en_US',
    H24: 'en_GB'
};

export const DATE_FORMAT_LOCALES = {
    MMDDYYYY: 'en_US',
    DDMMYYYY: 'en_GB',
    YYYYMMDD: 'en_CA'
};

export const loadDateFnLocale = async ({ locale, longLocale, locales, timeFormatLocale, dateFormatLocale }) => {
    const [appDateFnLocale, longDateFnLocale, dateFormatFnLocale, timeFormatFnLocale] = await Promise.all([
        locales[locale](),
        dateFormatLocale && timeFormatLocale ? undefined : locales[longLocale](),
        dateFormatLocale ? locales[dateFormatLocale]() : undefined,
        timeFormatLocale ? locales[timeFormatLocale]() : undefined
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
            date: (dateFormatFnLocale || longDateFnLocale).formatLong.date,
            time: (timeFormatFnLocale || longDateFnLocale).formatLong.time
        }
    };
};
