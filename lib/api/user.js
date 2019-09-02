export const getUser = () => ({
    url: 'users',
    method: 'get'
});

export const queryUnlock = () => ({
    url: 'users/unlock',
    method: 'put'
});

export const deleteUser = (data) => ({
    url: 'users/delete',
    method: 'put',
    data
});

export const unlockPasswordChanges = () => ({
    url: 'users/password',
    method: 'put'
});

export const lockSensitiveSettings = () => ({
    url: 'users/lock',
    method: 'put'
});

export const getHumanVerificationMethods = () => ({
    url: 'users/human',
    method: 'get'
});

export const querySMSVerificationCode = (Phone) => ({
    url: 'users/code',
    method: 'post',
    data: {
        Type: 'sms',
        Destination: { Phone }
    }
});

export const queryEmailVerificationCode = (Address) => ({
    url: 'users/code',
    method: 'post',
    data: {
        Type: 'email',
        Destination: { Address }
    }
});
