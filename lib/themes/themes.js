import themeDarkSvg from 'design-system/assets/img/pm-images/theme-dark.svg';
import themeLightSvg from 'design-system/assets/img/pm-images/theme-light.svg';
import lightTheme from 'design-system/_sass/pm-styles/_pm-light-theme.scss';
import themeBlueSvg from 'design-system/assets/img/pm-images/theme-blue.svg';
import blueTheme from 'design-system/_sass/pm-styles/_pm-blue-theme.scss';
import themeTestSvg from 'design-system/assets/img/pm-images/theme-test.svg';

export const PROTON_THEMES = {
    DARK: {
        label: 'Dark (Default)',
        identifier: '/* dark-theme */',
        src: themeDarkSvg,
        theme: '',
        customizable: false
    },
    LIGHT: {
        label: 'Light',
        identifier: '/* light-theme */',
        src: themeLightSvg,
        theme: lightTheme,
        customizable: false
    },
    BLUE: {
        label: 'Blue',
        identifier: '/* blue-theme */',
        src: themeBlueSvg,
        theme: blueTheme,
        customizable: false
    }
};

export const ALL_THEMES = {
    ...PROTON_THEMES,
    CUSTOM: {
        label: 'Custom theme',
        identifier: '/* custom-theme */',
        src: themeTestSvg,
        customizable: true
    }
};

export const DEFAULT_THEME = 'DARK';
