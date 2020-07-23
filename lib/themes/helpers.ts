import { PROTON_THEMES, CUSTOM_THEME, DEFAULT_THEME } from './themes';
import { DARK_MODE_CLASS } from '../constants';

const { protonThemeIdentifiers, protonThemes } = Object.values(PROTON_THEMES).reduce<{
    protonThemeIdentifiers: string[];
    protonThemes: { [key: string]: string };
}>(
    (acc, { identifier, theme }) => {
        acc.protonThemeIdentifiers.push(identifier);
        acc.protonThemes[identifier] = theme;
        return acc;
    },
    { protonThemeIdentifiers: [], protonThemes: {} }
);
const defaultThemeIdentifier = DEFAULT_THEME.identifier;

/**
 * Given a theme, return identifier
 */
export const getThemeIdentifier = (theme: string) => {
    if (!theme) {
        return defaultThemeIdentifier;
    }
    if (![defaultThemeIdentifier, ...protonThemeIdentifiers].includes(theme)) {
        return CUSTOM_THEME.identifier;
    }
    // for proton themes, the CSS for the theme coincides with the identifier
    return theme;
};

/**
 * Given a theme identifier, return true if it's the custom theme identifier, false otherwise
 */
export const isCustomThemeIdentifier = (themeIdentifier: string) => {
    return themeIdentifier === CUSTOM_THEME.identifier;
};

/**
 * Given a theme, return true if it's a custom one, false otherwise
 */
export const isCustomTheme = (theme: string) => {
    return isCustomThemeIdentifier(getThemeIdentifier(theme));
};

/**
 * Given a theme, return true if it corresponds to dark mode, false otherwise
 */
export const isDarkTheme = (theme: string) => {
    return getThemeIdentifier(theme) === PROTON_THEMES.DARK.identifier;
};

/**
 * Given a theme identifier with commented code as '\/* something *\/', extract 'something'
 */
export const stripThemeIdentifier = (themeIdentifier: string) => {
    const match = themeIdentifier.match(/\/\*(.*)\*\//);
    if (match) {
        return match[1].trim();
    }
    return themeIdentifier;
};

/**
 * Given a theme identifier, return theme
 */
export const getTheme = (themeIdentifier: string) => {
    if (protonThemeIdentifiers.includes(themeIdentifier)) {
        return protonThemes[themeIdentifier];
    }
    return '';
};

/**
 * Concat themes
 */
export const toStyle = (themes: string[] = []) => themes.join('\n');

/**
 * Given two arguments, the second meant to be used in dark mode and the first in the other cases,
 * pick the appropiate one depending on whether the class 'isDarkMode' is in the body or not
 */
export const getLightOrDark = <A, B>(light: A, dark: B) => {
    return document.body.classList.contains(DARK_MODE_CLASS) ? dark : light;
};
