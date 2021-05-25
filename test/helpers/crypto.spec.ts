import { xorEncryptDecrypt } from '../../lib/helpers/crypto';

describe('Crypto helpers', () => {
    describe('xorEncryptDecrypt', () => {
        it('encrypts and decrypts', () => {
            const key = 'dog';
            const data = 'cat';
            const xored = xorEncryptDecrypt({ key, data });

            expect(xorEncryptDecrypt({ key, data: xored })).toEqual(data);
        });

        it('does not strip trailing zeros when encrypting or decrypting', () => {
            const key = 'dogz';
            const data = 'cat\u0000';
            const xored = xorEncryptDecrypt({ key, data });

            expect(xorEncryptDecrypt({ key, data: xored })).toEqual(data);
        });
    });
});
