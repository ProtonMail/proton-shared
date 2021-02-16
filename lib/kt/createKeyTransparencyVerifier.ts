import { KTInfoToLS, ktSaveToLS, verifySelfAuditResult } from 'key-transparency-web-client';
import { Api, KeyPair, KeyTransparencyState, KeyTransparencyVerifier } from '../interfaces';

export const createKeyTransparencyVerifier = ({
    keyTransparencyState,
    api,
}: {
    keyTransparencyState: KeyTransparencyState;
    api: Api;
}) => {
    const ktMessageObjects: KTInfoToLS[] = [];

    const verify: KeyTransparencyVerifier = async ({ address, signedKeyList }) => {
        const ktMessageObject: KTInfoToLS = await verifySelfAuditResult(
            address,
            signedKeyList,
            keyTransparencyState.ktSelfAuditResult,
            keyTransparencyState.lastSelfAudit,
            keyTransparencyState.isRunning,
            api
        );
        ktMessageObjects.push(ktMessageObject);
    };

    const commit = async (userKeys: KeyPair[]) => {
        for (const ktMessageObject of ktMessageObjects) {
            await ktSaveToLS(ktMessageObject, userKeys, api);
        }
    };

    return {
        verify,
        commit,
    };
};
