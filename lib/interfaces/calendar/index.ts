import { OpenPGPKey } from 'pmcrypto';
import { Key } from './Key';

export * from './Calendar';
export * from './Event';
export * from './Alarm';
export * from './Member';
export * from './Key';
export * from './Passphrase';
export * from './Invite';
export * from './Decrypt';
export * from './VcalModel';

export interface DecryptedCalendarKey {
    Key: Key;
    privateKey: OpenPGPKey;
    publicKey: OpenPGPKey;
}

export interface InactiveCalendarKey {
    Key: Key;
    error: Error;
}
