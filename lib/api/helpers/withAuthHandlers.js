import { setRefreshCookies } from '../auth';
import {
    createOnceHandler,
    STATUS_CODE_TOO_MANY_REQUESTS,
    STATUS_CODE_UNAUTHORIZED,
    STATUS_CODE_UNLOCK
} from '../../apiHandlers';
import { MAX_RETRY_AFTER_ATTEMPT, MAX_RETRY_AFTER_TIMEOUT } from '../../constants';
import { wait } from '../../helpers/promise';

export const InactiveSessionError = () => {
    const error = new Error('Inactive session');
    error.name = 'InactiveSession';
    return error;
};

export const RetryError = () => {
    const error = new Error('Retry-After');
    error.name = 'RetryAfterError';
    return error;
};

export const CancelUnlockError = () => {
    const error = new Error('Cancel unlock');
    error.name = 'CancelUnlock';
    return error;
};

/**
 * Handle retry-after
 * @param {Error} e
 * @returns {Promise}
 */
const retryHandler = (e) => {
    const {
        response: { headers }
    } = e;

    const retryAfterSeconds = parseInt(headers.get('retry-after'), 10);

    if (!retryAfterSeconds || retryAfterSeconds <= 0 || retryAfterSeconds >= MAX_RETRY_AFTER_TIMEOUT) {
        return Promise.reject(RetryError());
    }

    return wait(retryAfterSeconds * 1000);
};

/**
 * Attach a catch handler to every API call to handle 401, 403, and other errors.
 * @param {function} call
 * @param {function} onUnlock
 * @param {function} onError
 * @return {function}
 */
export default ({ call, onUnlock, onError }) => {
    let loggedOut = false;

    /**
     * Handle refresh token. Happens when the access token has expired.
     * Multiple calls can fail, so this ensures the refresh route is called once.
     */
    const refreshHandler = createOnceHandler(() => call(setRefreshCookies()));
    const unlockHandler = createOnceHandler(onUnlock);

    return (options) => {
        const perform = (attempts) => {
            if (loggedOut) {
                return Promise.resolve().then(() => {
                    return onError(InactiveSessionError());
                });
            }

            return call(options).catch((e) => {
                if (loggedOut) {
                    return onError(InactiveSessionError());
                }

                if (attempts >= MAX_RETRY_AFTER_ATTEMPT) {
                    return onError(e);
                }

                const { status } = e;

                if (status === STATUS_CODE_UNAUTHORIZED) {
                    return refreshHandler().then(
                        () => perform(attempts + 1),
                        () => {
                            loggedOut = true;
                            return onError(InactiveSessionError());
                        }
                    );
                }

                if (status === STATUS_CODE_UNLOCK) {
                    return unlockHandler().then(() => perform(attempts + 1), (unlockError) => onError(unlockError));
                }

                if (status === STATUS_CODE_TOO_MANY_REQUESTS) {
                    return retryHandler(e).then(() => perform(attempts + 1), () => onError(e));
                }

                return onError(e);
            });
        };

        return perform(1);
    };
};
