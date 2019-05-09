import { decryptPrivateKey } from 'pmcrypto';
import { computeKeyPassword, AUTH_VERSION } from 'pm-srp';

import { srpVerify } from '../srp';
import { getUser } from '../api/user';
import { getKeySalts } from '../api/keys';
import { getInfo, setCookies } from '../api/auth';
import { upgradePassword } from '../api/settings';
import { isPgpMessage, decryptAccessToken } from './helpers';
import { getPrimaryKeyWithSalt } from '../keys/keys';
import { getRandomString } from '../helpers/string';
import loginWithFallback from './loginWithFallback';

import { ACTION_TYPES } from './loginReducer';
import { getUIDHeaders } from '../api';
import { mergeHeaders } from '../fetch/helpers';

const withUIDHeaders = (UID, config) => mergeHeaders(config, getUIDHeaders(UID));

export const handleFinalizeAction = async (state, { api }) => {
    try {
        const {
            credentials: { password },
            authResult: { AccessToken, UID, RefreshToken },
            ignoreUnlock,
            authVersion
        } = state;

        if (ignoreUnlock) {
            await api(
                setCookies({
                    UID,
                    AccessToken,
                    RefreshToken,
                    State: getRandomString(24)
                })
            );
        }

        if (authVersion < AUTH_VERSION) {
            await srpVerify({
                api,
                credentials: { password },
                config: withUIDHeaders(UID, upgradePassword())
            });
        }

        return {
            type: ACTION_TYPES.DONE
        };
    } catch (e) {
        return {
            type: ACTION_TYPES.ERROR,
            payload: e
        };
    }
};

export const handleUnlockAction = async (state, { api }) => {
    try {
        const {
            credentials: { mailboxPassword },
            primaryKey: { PrivateKey, KeySalt },
            authResult: { AccessToken, UID, RefreshToken }
        } = state;

        // Support for versions without a key salt.
        const keyPassword = KeySalt ? await computeKeyPassword(mailboxPassword, KeySalt) : mailboxPassword;
        const decryptedPrivateKey = await decryptPrivateKey(PrivateKey, keyPassword).catch(() => {
            const error = new Error('Wrong private key password');
            error.name = 'PasswordError';
            throw error;
        });

        // TODO: --Remove this once the deprecation has been removed in the API
        if (isPgpMessage(AccessToken)) {
            const accessToken = await decryptAccessToken(AccessToken, decryptedPrivateKey);

            await api(
                setCookies({
                    UID,
                    AccessToken: accessToken,
                    RefreshToken,
                    State: getRandomString(24)
                })
            );
        }
        // TODO: --Remove this once the deprecation has been removed in the API

        return {
            type: ACTION_TYPES.SUBMIT_UNLOCK_EFFECT,
            payload: keyPassword
        };
    } catch (e) {
        return {
            type: ACTION_TYPES.ERROR,
            payload: e
        };
    }
};

export const handleDeprecationAction = async (state, { api }) => {
    try {
        const {
            authResult: { AccessToken, RefreshToken, UID }
        } = state;

        await api(
            setCookies({
                UID,
                AccessToken,
                RefreshToken,
                State: getRandomString(24)
            })
        );

        const [{ User }, { KeySalts }] = await Promise.all([
            api(withUIDHeaders(UID, getUser())),
            api(withUIDHeaders(UID, getKeySalts()))
        ]);
        const primaryKey = getPrimaryKeyWithSalt(User.Keys, KeySalts);

        return {
            type: ACTION_TYPES.PREPARE_DEPRECATION_EFFECT,
            payload: { primaryKey, User }
        };
    } catch (e) {
        return {
            type: ACTION_TYPES.ERROR,
            payload: e
        };
    }
};

export const handleAuthAction = async (state, { api }) => {
    try {
        const { infoResult, credentials } = state;

        const loginResult = await loginWithFallback({
            api,
            credentials,
            initalAuthInfo: infoResult
        });

        return {
            type: ACTION_TYPES.SUBMIT_AUTH_EFFECT,
            payload: loginResult
        };
    } catch (e) {
        return {
            type: ACTION_TYPES.ERROR,
            payload: e
        };
    }
};

export const handleLoginAction = async (state, { api }) => {
    try {
        const {
            credentials: { username }
        } = state;

        const infoResult = await api(getInfo(username));

        return {
            type: ACTION_TYPES.SUBMIT_LOGIN_EFFECT,
            payload: infoResult
        };
    } catch (e) {
        return {
            type: ACTION_TYPES.ERROR,
            payload: e
        };
    }
};
