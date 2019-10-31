import { enGBLocale, enUSLocale } from './dateFnLocales';

export const loadDateFnLocale = async ({ locale, longLocale, locales }) => {
    const [appDateFnLocale, longDateFnLocale] = await Promise.all([locales[locale](), locales[longLocale]()]);

    /**
     * By default we use the same date-time locale as the user has selected in the app in order
     * to get the correct translations for days, months, year, etc. However, we override
     * the long date and time format to get 12 or 24 hour time and the correct date format depending
     * on what is selected in the browser since there is no settings for this in the mail application.
     * However in the calendar application there is a setting for this, so allow it to be overridden.
     */
    return {
        ...appDateFnLocale,
        formatLong: longDateFnLocale.formatLong
    };
};

export const loadDateFnTimeFormat = ({ dateLocale, displayAMPM = false }) => {
    const isAlreadyAMPMLocale = dateLocale.formatLong.time().includes('a');
    if (displayAMPM && isAlreadyAMPMLocale) {
        return dateLocale;
    }

    if (displayAMPM) {
        return {
            ...dateLocale,
            formatLong: {
                ...dateLocale.formatLong,
                time: enUSLocale.formatLong.time
            }
        };
    }

    return {
        ...dateLocale,
        formatLong: {
            ...dateLocale.formatLong,
            time: enGBLocale.formatLong.time
        }
    };
};
