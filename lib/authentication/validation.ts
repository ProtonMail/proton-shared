import { APP_NAMES } from '../constants';
import { FORKABLE_APPS } from './constants';
import { binaryStringToArray, decodeBase64URL } from '../helpers/string';

export const getValidatedApp = (app = ''): APP_NAMES | undefined => {
    if (app in FORKABLE_APPS) {
        return FORKABLE_APPS[app as keyof typeof FORKABLE_APPS];
    }
};

export const getValidatedLocalID = (localID = '') => {
    if (!localID) {
        return;
    }
    const maybeLocalID = parseInt(localID, 10);
    if (Number.isInteger(maybeLocalID) && maybeLocalID >= 0 && maybeLocalID <= 100000000) {
        return maybeLocalID;
    }
};

export const getValidatedSessionKey = (str: string) => {
    try {
        return binaryStringToArray(decodeBase64URL(str));
    } catch (e) {
        return undefined;
    }
};
