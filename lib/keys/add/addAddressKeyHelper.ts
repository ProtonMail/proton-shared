import { OpenPGPKey } from 'pmcrypto';
import { verifySelfAuditResult, KTInfoToLS } from 'key-transparency-web-client';
import { ActiveKey, Address, Api, EncryptionConfig, KeyTransparencyState } from '../../interfaces';
import { createAddressKeyRoute, createAddressKeyRouteV2 } from '../../api/keys';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '../../constants';
import { generateAddressKey, generateAddressKeyTokens } from '../addressKeys';
import { getActiveKeyObject, getPrimaryFlag } from '../getActiveKeys';
import { getSignedKeyList } from '../signedKeyList';

interface CreateAddressKeyLegacyArguments {
    api: Api;
    encryptionConfig?: EncryptionConfig;
    address: Address;
    passphrase: string;
    activeKeys: ActiveKey[];
    keyTransparencyState?: KeyTransparencyState;
}

export const createAddressKeyLegacy = async ({
    api,
    address,
    encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
    passphrase,
    activeKeys,
    keyTransparencyState,
}: CreateAddressKeyLegacyArguments) => {
    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email: address.Email,
        passphrase,
        encryptionConfig,
    });
    const newActiveKey = await getActiveKeyObject(privateKey, { ID: 'tmp', primary: getPrimaryFlag(activeKeys) });
    const updatedActiveKeys = [...activeKeys, newActiveKey];
    const SignedKeyList = await getSignedKeyList(updatedActiveKeys);

    let ktMessageObject: KTInfoToLS | undefined;
    if (keyTransparencyState) {
        ktMessageObject = await verifySelfAuditResult(
            address,
            SignedKeyList,
            keyTransparencyState.ktSelfAuditResult,
            keyTransparencyState.lastSelfAudit,
            keyTransparencyState.isRunning,
            api
        );
    }

    const { Key } = await api(
        createAddressKeyRoute({
            AddressID: address.ID,
            Primary: newActiveKey.primary,
            PrivateKey: privateKeyArmored,
            SignedKeyList,
        })
    );
    newActiveKey.ID = Key.ID;

    return [newActiveKey, updatedActiveKeys, ktMessageObject] as const;
};

interface CreateAddressKeyV2Arguments {
    api: Api;
    userKey: OpenPGPKey;
    encryptionConfig?: EncryptionConfig;
    address: Address;
    activeKeys: ActiveKey[];
    keyTransparencyState?: KeyTransparencyState;
}

export const createAddressKeyV2 = async ({
    api,
    userKey,
    encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
    address,
    activeKeys,
    keyTransparencyState,
}: CreateAddressKeyV2Arguments) => {
    const { token, encryptedToken, signature } = await generateAddressKeyTokens(userKey);
    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email: address.Email,
        passphrase: token,
        encryptionConfig,
    });
    const newActiveKey = await getActiveKeyObject(privateKey, { ID: 'tmp', primary: getPrimaryFlag(activeKeys) });
    const updatedActiveKeys = [...activeKeys, newActiveKey];
    const SignedKeyList = await getSignedKeyList(updatedActiveKeys);

    let ktMessageObject: KTInfoToLS | undefined;
    if (keyTransparencyState) {
        ktMessageObject = await verifySelfAuditResult(
            address,
            SignedKeyList,
            keyTransparencyState.ktSelfAuditResult,
            keyTransparencyState.lastSelfAudit,
            keyTransparencyState.isRunning,
            api
        );
    }

    const { Key } = await api(
        createAddressKeyRouteV2({
            AddressID: address.ID,
            Primary: newActiveKey.primary,
            PrivateKey: privateKeyArmored,
            SignedKeyList,
            Signature: signature,
            Token: encryptedToken,
        })
    );
    newActiveKey.ID = Key.ID;

    return [newActiveKey, updatedActiveKeys, ktMessageObject] as const;
};
