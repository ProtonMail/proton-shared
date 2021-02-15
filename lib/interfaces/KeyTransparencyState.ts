import { KTInfoSelfAudit } from 'key-transparency-web-client';

export interface KeyTransparencyState {
    ktSelfAuditResult: Map<string, KTInfoSelfAudit>;
    lastSelfAudit: number;
    isRunning: boolean;
}
