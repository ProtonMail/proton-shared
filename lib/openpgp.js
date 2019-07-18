import { hasModulesSupport, getOS } from './helpers/browser';
import { initMain, initWorker } from './helpers/setupPmcrypto';

// eslint-disable-next-line no-undef
const { main, compat, worker } = PM_OPENPGP;

const dl = ({ filepath, integrity }) => {
    const options = {
        integrity,
        credentials: 'include'
    };
    return fetch(filepath, options).then((response) => response.text());
};

/**
 * There is a bug in iOS that prevents the openpgp worker from functioning properly.
 * It's on all browsers there because they use the webkit engine.
 * See https://github.com/ProtonMail/Angular/issues/8444
 * @returns {boolean}
 */
const isUnsupportedWorker = () => {
    const { name, version } = getOS();
    return name.toLowerCase() === 'ios' && parseInt(version, 10) === 11;
};

/**
 * Initialize openpgp
 * @return {Promise}
 */
export const init = async () => {
    // pre-fetch everything
    const isCompat = !hasModulesSupport();
    const openpgpFile = isCompat ? compat : main;

    // Fetch again if it fails, mainly to solve chrome bug (related to dev tools?) "body stream has been lost and cannot be disturbed"
    const openpgpPromise = dl(openpgpFile).catch(() => dl(openpgpFile));
    const workerPromise = dl(worker).catch(() => dl(worker));

    const openpgpContents = await openpgpPromise;
    await initMain(openpgpContents);

    // Compat browsers do not support the worker.
    if (isCompat || isUnsupportedWorker()) {
        return;
    }

    // lazily create the workers (no need to wait for it to finish);
    workerPromise.then((result) => {
        initWorker(openpgpContents, result);
    });
};

let promise;

/**
 * Get the openpgp init promise singleton
 * @return {Promise}
 */
export const loadOpenPGP = () => {
    // eslint-disable-next-line no-return-assign
    return promise || (promise = init());
};
