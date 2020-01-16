import { ADDRESS_TYPE } from '../constants';
import { Keys } from './Keys';

export interface Address {
    DisplayName: string;
    DomainID: string;
    Email: string;
    HasKeys: number;
    ID: string;
    Keys: Keys[];
    Order: number;
    Priority: number;
    Receive: number;
    Send: number;
    Signature: string;
    Status: number;
    Type: ADDRESS_TYPE;
}
