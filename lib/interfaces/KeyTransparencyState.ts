import { KTInfoSelfAudit } from 'key-transparency-web-client';
import { Address } from './Address';
import { SignedKeyList } from './SignedKeyList';

export interface KeyTransparencyState {
    ktSelfAuditResult: Map<string, KTInfoSelfAudit>;
    lastSelfAudit: number;
    isRunning: boolean;
}

export type KeyTransparencyVerifier = (props: { address: Address; signedKeyList: SignedKeyList }) => Promise<void>;
