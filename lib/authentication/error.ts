export class InvalidPersistentSessionError extends Error {
    constructor() {
        super('Persistent session invalid');
        Object.setPrototypeOf(this, InvalidPersistentSessionError.prototype);
    }
}

export class InvalidAuthorizeError extends Error {
    constructor() {
        super('Authorize invalid');
        Object.setPrototypeOf(this, InvalidAuthorizeError.prototype);
    }
}

export class InvalidForkError extends Error {
    constructor() {
        super('Fork invalid');
        Object.setPrototypeOf(this, InvalidForkError.prototype);
    }
}
