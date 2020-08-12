import { OpenPGPKey } from 'pmcrypto';

export interface KeyAction {
    privateKey: OpenPGPKey;
    primary: 1 | 0;
    flags: number;
    ID: string;
}
