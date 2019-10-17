/* eslint-disable @typescript-eslint/camelcase */
import { c } from 'ttag';
import { format } from 'date-fns';

import dateFnLocales from '../../lib/i18n/dateFnLocales';
import { getClosestMatch } from '../../lib/i18n/helper';
import { loadDateFnLocale } from '../../lib/i18n/dateFnLocale';
import { loadTtagLocale } from '../../lib/i18n/ttagLocale';

describe('helper', () => {
    it('should get the closest locale', () => {
        expect(getClosestMatch('en_US', { en_US: true })).toBe('en_US');
        expect(getClosestMatch('en', { en_US: true })).toBe('en_US');
        expect(getClosestMatch('sv', { en_US: true })).toBeUndefined();
    });
});

const getTranslation = (data) => {
    return {
        headers: {
            'plural-forms': 'nplurals=2; plural=(n != 1);'
        },
        contexts: {
            Action: {
                'Hey monique': [data]
            }
        }
    };
};

describe('Load the locale', () => {
    it('should load a fr_FR translation', async () => {
        await loadTtagLocale({
            locale: 'fr_FR',
            language: 'fr',
            locales: { fr_FR: async () => getTranslation('Salut monique') }
        });
        expect(c('Action').t`Hey monique`).toBe('Salut monique');
    });
});

describe('Load date locales', () => {
    const zero = new Date(2000, 0, 1, 0, 0, 0);

    it('should load a fr_FR date locale if the translation exists', async () => {
        const dateFnLocale = await loadDateFnLocale({
            locale: 'fr',
            longLocale: 'fr',
            locales: dateFnLocales
        });
        expect(format(zero, 'iiii', { locale: dateFnLocale })).toBe('samedi');
    });

    it('should use long date format from browser and other format from locale', async () => {
        const dateFnLocale = await loadDateFnLocale({
            locale: 'en_US',
            longLocale: 'fr',
            locales: dateFnLocales
        });
        expect(format(zero, 'Pp', { locale: dateFnLocale })).toBe('01/01/2000, 00:00');
    });

    it('should override time format and date format with 12 hour format and year format', async () => {
        const dateFnLocale = await loadDateFnLocale({
            locale: 'en_US',
            longLocale: 'fr',
            locales: dateFnLocales,
            timeFormat: '12',
            dateFormat: 'YYYYMMDD'
        });
        expect(format(zero, 'Pp', { locale: dateFnLocale })).toBe('2000-01-01, 12:00 AM');
    });

    it('should override time format and date format with 24 hour format and year format', async () => {
        const dateFnLocale = await loadDateFnLocale({
            locale: 'en_US',
            longLocale: 'en_US',
            locales: dateFnLocales,
            timeFormat: '24',
            dateFormat: 'DDMMYYYY'
        });
        const date = new Date(2019, 9, 7, 12, 5);
        expect(format(date, 'Pp', { locale: dateFnLocale })).toBe('07/10/2019, 12:05');
    });
});
