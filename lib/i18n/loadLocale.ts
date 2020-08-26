import { addLocale as ttagAddLocale, useLocale as ttagUseLocale } from 'ttag';
import dateFnLocales from './dateFnLocales';
import { setDateLocales, setLocales } from './index';
import { getDateFnLocaleWithSettings, Options } from './dateFnLocale';
import { TtagLocaleMap } from '../interfaces/Locale';
import { DEFAULT_LOCALE } from '../constants';
import { getClosestLocaleMatch } from './helper';

export const loadLocale = async (localeCode: string, locales: TtagLocaleMap) => {
    const languageCode = localeCode.substr(0, 2);

    if (localeCode !== DEFAULT_LOCALE) {
        const data = await locales[localeCode]();
        ttagAddLocale(localeCode, data);
    }
    ttagUseLocale(localeCode);

    setLocales({
        localeCode,
        languageCode,
    });

    document.documentElement.lang = languageCode;
};

export const loadDateLocale = async (dateLocaleCode: string, options?: Options) => {
    const closestLocaleCode = getClosestLocaleMatch(dateLocaleCode, dateFnLocales);
    if (!closestLocaleCode) {
        return;
    }
    const dateFnLocale = await dateFnLocales[closestLocaleCode]();
    const updatedDateFnLocale = getDateFnLocaleWithSettings(dateFnLocale, options);

    setDateLocales({
        defaultDateLocale: dateFnLocale,
        dateLocale: updatedDateFnLocale,
        dateLocaleCode,
    });

    return updatedDateFnLocale;
};
