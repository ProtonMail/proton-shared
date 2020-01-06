declare module 'pmcrypto/lib/openpgp' {
    const openpgp: any;
    export { openpgp };
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
