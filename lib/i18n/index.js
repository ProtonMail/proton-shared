/* eslint-disable import/no-mutable-exports,prefer-destructuring */
import { enUSLocale } from './dateFnLocales';

/**
 * The locales are exported as mutable exports:
 * 1) To avoid using a react context for components deep in the tree
 * 2) It's more similar to ttag
 */
export let dateLocale = enUSLocale;
export let dateLocaleCode = 'en_US';
export let localeCode = 'en_US';
export let languageCode = 'en';

export const setLocales = (values) => {
    dateLocale = values.dateLocale;
    dateLocaleCode = values.dateLocaleCode;
    localeCode = values.localeCode;
    languageCode = values.languageCode;
};
