declare module 'get-random-values' {
    const randomValues: (arr: Uint8Array) => Uint8Array;

    export default randomValues;
}

declare module 'pmcrypto' {
    const decryptMessage: any;
    const getMessage: any;
    const encryptMessage: any;
    const generateKey: any;
    const decryptPrivateKey: any;
    const binaryStringToArray: any;
    const signMessage: any;
    const arrayToHexString: any;
    export {
        decryptMessage,
        getMessage,
        encryptMessage,
        generateKey,
        decryptPrivateKey,
        binaryStringToArray,
        signMessage,
        arrayToHexString
    };
}
