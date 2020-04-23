import { OpenPGPKey, signMessage } from 'pmcrypto';
import { CONTACT_CARD_TYPE } from '../constants';
import { ContactCard } from '../interfaces/contacts';
import { CRYPTO_PROCESSING_TYPES } from './constants';
import { readSigned } from './decrypt';

/**
 * Re-sign contact cards
 * Public keys need to be passed to check signature validity of signed contact cards
 * Private keys (typically only the primary one) need to be passed to re-sign the contact cards
 */
interface Params {
    contactCards: ContactCard[];
    publicKeys: OpenPGPKey[];
    privateKeys: OpenPGPKey[];
}
export const resignCards = async ({ contactCards, publicKeys, privateKeys }: Params): Promise<ContactCard[]> => {
    // get the signed cards of the contact. Throw if there are errors
    const { signedCards, otherCards } = contactCards.reduce<{ signedCards: ContactCard[]; otherCards: ContactCard[] }>(
        (acc, card) => {
            if (card.Type === CONTACT_CARD_TYPE.SIGNED) {
                acc.signedCards.push(card);
            } else {
                acc.otherCards.push(card);
            }
            return acc;
        },
        { signedCards: [], otherCards: [] }
    );
    const readSignedCards = await Promise.all(signedCards.map((card) => readSigned(card, { publicKeys })));
    readSignedCards.forEach(({ type, error }) => {
        if (type !== CRYPTO_PROCESSING_TYPES.SUCCESS) {
            throw error;
        }
    });
    const signedVcards = readSignedCards.map(({ data }) => data as string);
    const reSignedCards = await Promise.all(
        signedVcards.map((vcard) => {
            return signMessage({ data: vcard, privateKeys, armor: true, detached: true }).then(
                ({ signature: Signature }) => {
                    const card: ContactCard = {
                        Type: CONTACT_CARD_TYPE.SIGNED,
                        Data: vcard,
                        Signature
                    };
                    return card;
                }
            );
        })
    );
    return [...reSignedCards, ...otherCards];
};
