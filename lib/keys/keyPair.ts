function ab2str(buf: Iterable<number>): string {
    // @ts-ignore
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function wrapKey(header: string, key: Iterable<number>): string {
    const exportedAsString = ab2str(key);
    const exportedAsBase64 = window.btoa(exportedAsString);

    return `-----BEGIN ${header}-----\n${exportedAsBase64}\n-----END ${header}-----`;
}

async function exportCryptoKey(key: CryptoKey, format: string, header: string): Promise<string> {
    // @ts-ignore
    return wrapKey(header, await window.crypto.subtle.exportKey(format, key));
}

export function isCryptoSupported(): boolean {
    return 'crypto' in window;
}

export function generateKeyPair(
    algorithm: RsaHashedKeyGenParams | EcKeyGenParams,
    keyUsages: KeyUsage[]
): Promise<CryptoKeyPair> {
    return window.crypto.subtle.generateKey(algorithm, true, keyUsages);
}

export function generateRsaKeyPair(modulusLength: number = 2048): Promise<CryptoKeyPair> {
    return generateKeyPair(
        {
            name: 'RSA-PSS',
            modulusLength,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        ['sign', 'verify']
    );
}

export function generateEcKeyPair(namedCurve: NamedCurve = 'P-256'): Promise<CryptoKeyPair> {
    return generateKeyPair(
        {
            name: 'ECDH',
            namedCurve,
        },
        ['deriveKey', 'deriveBits']
    );
}

export function exportPrivateKey(key: CryptoKeyPair): Promise<string> {
    return exportCryptoKey(key.privateKey, 'pkcs8', 'PRIVATE KEY');
}

export function exportPublicKey(key: CryptoKeyPair): Promise<string> {
    return exportCryptoKey(key.publicKey, 'spki', 'PUBLIC KEY');
}
