export const MESSAGE_FLAGS = {
    FLAG_RECEIVED:      1 << 0, // whether a message is received
    FLAG_SENT:          1 << 1, // whether a message is sent
    FLAG_INTERNAL:      1 << 2, // whether the message is between ProtonMail recipients
    FLAG_E2E:           1 << 3, // whether the message is end-to-end encrypted
    FLAG_AUTO:          1 << 4, // whether the message is an autoresponse
    FLAG_REPLIED:       1 << 5, // whether the message is replied to
    FLAG_REPLIEDALL:    1 << 6, // whether the message is replied all to
    FLAG_FORWARDED:     1 << 7, // whether the message is forwarded
    FLAG_AUTOREPLIED:   1 << 8, // whether the message has been responded to with an autoresponse
    FLAG_IMPORTED:      1 << 9, // whether the message is an import
    FLAG_OPENED:       1 << 10, // whether the message has ever been opened by the user
    FLAG_RECEIPT_SENT: 1 << 11, // whether a read receipt has been sent in response to the message
    // For drafts only
    FLAG_RECEIPT_REQUEST: 1 << 16, // whether to request a read receipt for the message
    FLAG_PUBLIC_KEY:      1 << 17, // whether to attach the public key
    FLAG_SIGN:            1 << 18, // whether to sign the message
    FLAG_UNSUBSCRIBED:    1 << 19, // Unsubscribed from newsletter
    FLAG_SCHEDULED_SEND:  1 << 20, // Messages that have been delayed send
    FLAG_DMARC_FAIL:      1 << 26, // Incoming mail failed dmarc authentication.
    FLAG_HAM_MANUAL:      1 << 27, // The message is in spam and the user moves it to a new location that is not spam or trash (e.g. inbox or archive).
    FLAG_PHISHING_AUTO:   1 << 30, // Incoming mail is marked as phishing by anti-spam filters.
};

export enum VERIFICATION_STATUS {
    NOT_VERIFIED = -1,
    NOT_SIGNED,
    SIGNED_AND_VALID,
    SIGNED_AND_INVALID,
    SIGNED_NO_PUB_KEY = 3,
}

// Protonmail enforces signing outgoing messages since January 1, 2019. It does not sign bulk messages yet
export const SIGNATURE_START = {
    USER: 1546300800,
    BULK: Infinity,
};
