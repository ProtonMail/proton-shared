import { arrayToBinaryString, arrayToHexString, binaryStringToArray, SHA256 } from 'pmcrypto';
import { uint8ArrayToBase64String } from './encoding';

export const getSHA256String = async (data: string) => {
    const value = await SHA256(binaryStringToArray(data));
    return arrayToHexString(value);
};

export const getSHA256BinaryString = async (data: string) => {
    const value = await SHA256(binaryStringToArray(data));
    return arrayToBinaryString(value);
};

export const getSHA256Base64String = async (data: string) => {
    const value = await SHA256(binaryStringToArray(data));
    return uint8ArrayToBase64String(value);
};
