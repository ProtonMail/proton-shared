import { VcalVeventComponent } from './VcalModel';

export type DecryptedVeventResult = { veventComponent: VcalVeventComponent; isVerified: boolean | undefined };
export type DecryptedPersonalVeventMapResult = { [memberID: string]: DecryptedVeventResult | undefined };
