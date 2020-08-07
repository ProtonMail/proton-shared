import { APP_NAMES, APPS, APPS_CONFIGURATION, isSSOMode } from '../constants';
import isTruthy from '../helpers/isTruthy';
import { stripLeadingAndTrailingSlash } from '../helpers/string';
import { getLocalIDPath } from '../authentication/pathnameHelper';

export const getAppHref = (to: string, toApp: APP_NAMES, localID?: number) => {
    const targetSubdomain = APPS_CONFIGURATION[toApp].subdomain;
    const { hostname, protocol } = window.location;
    const secondLevelDomain = hostname.substr(hostname.indexOf('.') + 1);
    const targetDomain = [targetSubdomain, secondLevelDomain].filter(isTruthy).join('.');
    return [`${protocol}//`, targetDomain, getLocalIDPath(localID), stripLeadingAndTrailingSlash(to)]
        .filter(isTruthy)
        .join('/');
};

export const getAppHrefBundle = (to: string, toApp: APP_NAMES) => {
    return [APPS_CONFIGURATION[toApp].publicPath, stripLeadingAndTrailingSlash(to)].filter(isTruthy).join('/');
};

export const getAccountSettingsApp = () => (isSSOMode ? APPS.PROTONACCOUNT : APPS.PROTONMAIL_SETTINGS);
