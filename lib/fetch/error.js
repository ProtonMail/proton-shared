/**
 * Create an API error.
 */
export const createApiError = ({ response, data, config, name }) => {
    const { statusText, status } = response;

    const error = new Error(statusText);

    error.name = name;
    error.response = response;
    error.status = status;
    error.data = data;
    error.config = config;

    return error;
};
