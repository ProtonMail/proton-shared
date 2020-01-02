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
    export { decryptMessage, getMessage, encryptMessage, generateKey, decryptPrivateKey };
}
