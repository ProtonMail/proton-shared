import { enGBLocale, enUSLocale } from './dateFnLocales';

export const loadDateFnLocale = async ({ locale, longLocale, locales }) => {
    const [appDateFnLocale, longDateFnLocale] = await Promise.all([locales[locale](), locales[longLocale]()]);

    /**
     * By default we use the same date-time locale as the user has selected in the app in order
     * to get the correct translations for days, months, year, etc. However, we override
     * the long date and time format to get 12 or 24 hour time and the correct date format depending
     * on what is selected in the browser since there is no settings for this in the mail application.
     */
    return {
        ...appDateFnLocale,
        formatLong: longDateFnLocale.formatLong
    };
};

/*
 * Allow to override the long date format.
 * Primarily intended for the calendar application, where a user can override AMPM time.
 */
export const loadDateFnTimeFormat = ({ dateLocale, displayAMPM = false }) => {
    const isAMPMLocale = dateLocale.formatLong.time().includes('a');
    if ((displayAMPM && isAMPMLocale) || (!displayAMPM && !isAMPMLocale)) {
        return dateLocale;
    }

    return {
        ...dateLocale,
        formatLong: {
            ...dateLocale.formatLong,
            time: (displayAMPM ? enUSLocale : enGBLocale).formatLong.time
        }
    };
};
