import { ADDRESS_TYPE } from '../constants';
import { Key } from './Key';
import { SignedKeyList, SignedKeyListEpochs } from './SignedKeyList';

export interface AddressKey extends Key {
    Active: 0 | 1;
}
export interface Address {
    DisplayName: string;
    DomainID: string;
    Email: string;
    HasKeys: number;
    ID: string;
    Keys: AddressKey[];
    SignedKeyList: SignedKeyListEpochs | null;
    Order: number;
    Priority: number;
    Receive: number;
    Send: number;
    Signature: string;
    Status: number;
    Type: ADDRESS_TYPE;
}

export interface AddressKeyPayload {
    AddressID: string;
    PrivateKey: string;
    SignedKeyList: SignedKeyList;
}

export interface AddressKeyPayloadV2 {
    AddressID: string;
    Token: string;
    Signature: string;
    PrivateKey: string;
    SignedKeyList: SignedKeyList;
}

export interface Recipient {
    Name: string;
    Address: string;
    ContactID?: string;
    Group?: string;
}
