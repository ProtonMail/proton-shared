export class PersistentSessionInvalid extends Error {
    constructor() {
        super('Persistent session invalid');
        Object.setPrototypeOf(this, PersistentSessionInvalid.prototype);
    }
}
