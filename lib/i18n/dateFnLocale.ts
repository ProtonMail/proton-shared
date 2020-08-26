import { Locale } from 'date-fns';
import { enGBLocale, enUSLocale } from './dateFnLocales';
import { SETTINGS_DATE_FORMAT, SETTINGS_TIME_FORMAT, SETTINGS_WEEK_START } from '../interfaces';

export interface Options {
    TimeFormat: SETTINGS_TIME_FORMAT;
    DateFormat: SETTINGS_DATE_FORMAT;
    WeekStart: SETTINGS_WEEK_START;
}

export const loadDateFnTimeFormat = (dateLocale: Locale, displayAMPM = false): Locale => {
    const isAMPMLocale = dateLocale.formatLong?.time().includes('a');
    if ((displayAMPM && isAMPMLocale) || (!displayAMPM && !isAMPMLocale)) {
        return dateLocale;
    }

    const time = (displayAMPM ? enUSLocale : enGBLocale).formatLong?.time;

    return {
        ...dateLocale,
        formatLong: {
            ...dateLocale.formatLong,
            // @ts-ignore
            time,
        },
    };
};

export const getDateFnLocaleWithSettings = (
    locale: Locale,
    {
        TimeFormat = SETTINGS_TIME_FORMAT.LOCALE_DEFAULT,
        DateFormat = SETTINGS_DATE_FORMAT.LOCALE_DEFAULT,
        WeekStart = SETTINGS_WEEK_START.LOCALE_DEFAULT,
    }: Partial<Options> = {}
) => {
    let copy: Locale = {
        ...locale,
    };

    if (TimeFormat !== SETTINGS_TIME_FORMAT.LOCALE_DEFAULT) {
        const displayAMPM = TimeFormat === SETTINGS_TIME_FORMAT.H12;
        copy = loadDateFnTimeFormat(locale, displayAMPM);
    }

    if (DateFormat !== SETTINGS_DATE_FORMAT.LOCALE_DEFAULT) {
        /*
            TODO: Override with the date locale. It's left as TODO since currently this doesn't have any visible impact.
         */
    }

    if (WeekStart !== SETTINGS_WEEK_START.LOCALE_DEFAULT && WeekStart >= 1 && WeekStart <= 7) {
        copy.options = {
            ...copy.options,
            weekStartsOn: (WeekStart % 7) as any,
        };
    }

    return copy;
};
