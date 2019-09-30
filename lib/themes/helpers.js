import { ALL_THEMES, DEFAULT_THEME } from './themes';

const {
    [DEFAULT_THEME]: { identifier: defaultThemeIdentifier },
    CUSTOM: { identifier: customThemeIdentifier }
} = ALL_THEMES;

const { themeIdentifiers, themes } = Object.values(ALL_THEMES).reduce(
    (acc, { identifier, theme }) => {
        acc.themeIdentifiers.push(identifier);
        acc.themes.push(theme);
        return acc;
    },
    { themeIdentifiers: [], themes: [] }
);

/**
 * Given a theme, return identifier
 * @param {String} theme            CSS associated to a theme
 * @return {String}                 theme identifier
 */
export const getThemeIdentifier = (theme) => {
    if (!theme) {
        return defaultThemeIdentifier;
    }
    if (!themeIdentifiers.includes(theme)) {
        return customThemeIdentifier;
    }
    return theme;
};

/**
 * Given a theme identifier, return theme
 * @param {String} themeIdentifier          theme identifier
 * @return {String}                         CSS associated to a theme
 */
export const getTheme = (themeIdentifier) => {
    const index = themeIdentifiers.findIndex((identifier) => identifier === themeIdentifier);
    return index !== -1 ? themes[index] : '';
};

/**
 * Given a theme identifier with commented code as '\/* something *\/', extract 'something'
 * @param {String} themeIdentifier      theme identifier with comment markers
 * @return {String}                     theme identifier without comment markers
 */
export const stripThemeIdentifier = (themeIdentifier) => {
    const regex = /\/\*(.*)\*\//;
    if (regex.test(themeIdentifier)) {
        return themeIdentifier.match(/\/\*(.*)\*\//)[1].trim();
    }
    return themeIdentifier;
};

/**
 * Concat themes
 * @param {Array<String>} themes
 * @returns {String}
 */
export const toStyle = (themes = []) => themes.join('\n');
