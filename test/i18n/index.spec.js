import { formatLocale, getLocale } from '../../lib/i18n';

const mockNavigator = {
    languages: null,
    language: '',
    userLanguage: ''
};

const setMockNavigator = () => {
    Object.defineProperty(window, 'navigator', { value: mockNavigator });
};

const setBrowserLanguage = (value) => {
    mockNavigator.language = value;
};

const setBrowserLanguages = (languages = []) => {
    mockNavigator.languages = languages;
};
const setUserLanguage = (userLanguage) => {
    mockNavigator.userLanguage = userLanguage;
};

setMockNavigator();

fdescribe('Format the locale', () => {
    beforeEach(() => {
        setUserLanguage('');
        setBrowserLanguage('');
        setBrowserLanguages(null);
    });

    it('should extract the lang from the navigator by default', () => {
        setBrowserLanguage('es_ES');
        const locale = formatLocale();
        expect(locale).toEqual('es_ES');
    });

    it('should extract the lang set by the user', () => {
        setBrowserLanguage('es_ES');
        setUserLanguage('de_DE');
        const locale = formatLocale();
        expect(locale).toEqual('de_DE');
    });

    it('should extract the first lang from the languages prop of the browser', () => {
        setBrowserLanguage('es_ES');
        setUserLanguage('de_DE');
        setBrowserLanguages(['fr_FR', 'it_IT', 'en_US']);
        const locale = formatLocale();
        expect(locale).toEqual('fr_FR');
    });

    it('should get the current locale', () => {
        setBrowserLanguage('es_ES');
        setUserLanguage('de_DE');
        setBrowserLanguages(['fr_FR', 'it_IT', 'en_US']);
        const locale = formatLocale('id_ID');
        expect(locale).toEqual('id_ID');
    });
});

fdescribe('Get the locale', () => {
    beforeEach(() => {
        setUserLanguage('');
        setBrowserLanguage('');
        setBrowserLanguages(null);
    });

    describe('No languages available inside the app', () => {
        beforeEach(() => {
            setUserLanguage('es_ES');
            setBrowserLanguage('es_ES');
            setBrowserLanguages(['es_ES', 'fr_FR']);
        });

        it('should return the default lang en_US', () => {
            const { browser, locale, language } = getLocale();
            expect(browser).toEqual('es_ES');
            expect(language).toEqual('en');
            expect(locale).toEqual('en_US');
        });

        it('should return the default lang en_US - 2', () => {
            const { browser, locale, language } = getLocale('es_ES');
            expect(browser).toEqual('es_ES');
            expect(language).toEqual('en');
            expect(locale).toEqual('en_US');
        });
    });

    describe('Languages available inside the app', () => {
        beforeEach(() => {
            setUserLanguage('es_ES');
            setBrowserLanguage('es_ES');
            setBrowserLanguages(['es_ES', 'fr_FR']);
        });

        it('should return the lang matching the config from the user', () => {
            const { browser, locale, language } = getLocale(null, ['es_ES']);
            expect(browser).toEqual('es_ES');
            expect(language).toEqual('es');
            expect(locale).toEqual('es_ES');
        });

        it('should a specific lang available', () => {
            const { browser, locale, language } = getLocale('ja_JP', ['es_ES', 'ja_JP']);
            expect(browser).toEqual('es_ES');
            expect(language).toEqual('ja');
            expect(locale).toEqual('ja_JP');
        });
    });
});
