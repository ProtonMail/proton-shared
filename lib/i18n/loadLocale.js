import dateFnLocales from './dateFnLocales';
import { setLocales } from './index';
import { loadTtagLocale } from './ttagLocale';
import { loadDateFnLocale } from './dateFnLocale';

/**
 * Load a new ttag and date-fn locale in the app.
 * @param {String} localeCode
 * @param {String} dateLocaleCode
 * @param {String} longDateLocaleCode
 * @param {String} languageCode
 * @param {Object} locales
 * @param {String} [dateFormat]
 * @param {String} [timeFormat]
 * @return {Promise}
 */
export default async ({
    localeCode,
    dateLocaleCode,
    longDateLocaleCode,
    languageCode,
    locales,
    dateFormat,
    timeFormat
}) => {
    const [dateLocale] = await Promise.all([
        loadDateFnLocale({
            locale: dateLocaleCode,
            longLocale: longDateLocaleCode,
            locales: dateFnLocales,
            dateFormat,
            timeFormat
        }),
        loadTtagLocale({
            locale: localeCode,
            language: languageCode,
            locales
        })
    ]);

    setLocales({
        localeCode,
        dateLocaleCode,
        languageCode,
        dateLocale
    });

    document.documentElement.lang = languageCode;
};
