import { Address } from '../interfaces/Address';

export const isPrimaryAddress = (address: Address) => address.Order === 1;

export const getPrimaryAddress = (addresses: Address[]) => addresses.find(isPrimaryAddress);
