export const getError = (e) => {
    const { data, status } = e;

    if (!data) {
        return {
            status,
        };
    }

    const { Error: errorMessage, Code: errorCode, Details = {} } = data;
    const { MissingScopes = [] } = Details;

    if (!errorMessage) {
        return {
            status,
        };
    }

    return {
        status,
        code: errorCode,
        message: errorMessage,
        missingScopes: MissingScopes,
    };
};

export const createOnceHandler = (createPromise) => {
    let promise;

    const clear = () => {
        promise = undefined;
    };

    return () => {
        if (promise) {
            return promise;
        }

        promise = createPromise()
            .then(clear)
            .catch((e) => {
                clear();
                throw e;
            });
        return promise;
    };
};
