import createStore from './helpers/store';
import { load, save } from './helpers/secureSessionStorage';

/**
 * @param {Array} keys
 * @return {{set, getState, get, reset, remove}}
 */
export default (keys = []) => {
    const store = createStore(load(keys));

    const cb = (event) => {
        if (!event.persisted) {
            save(keys, store.getState());
        }
    };

    const terminationEvent = 'onpagehide' in window ? 'pagehide' : 'unload';
    window.addEventListener(terminationEvent, cb, true);

    return store;
};
