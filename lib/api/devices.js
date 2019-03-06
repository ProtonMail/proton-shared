export const registerDevice = ({ DeviceToken, DeviceName, DeviceModel, DeviceVersion, AppVersion, Environment, PublicKey }) => ({
    method: 'post',
    url: 'devices',
    data: { DeviceToken, DeviceName, DeviceModel, DeviceVersion, AppVersion, Environment, PublicKey },
});

export const unregisterDevice = (UID, DeviceToken) => ({
    method: 'delete',
    url: 'devices',
});

export const iOSNotificationTest = (token, { Badge, Text, MessageID }) => ({
    method: 'post',
    url: `devices/ios/${token}`,
    data: { Badge, Text, MessageID },
});

export const androidNotificationTest = (token, { Title, Subtitle, Badge, Text, MessageID }) => ({
    method: 'post',
    url: `devices/android/${token}`,
    data: { Title, Subtitle, Badge, Text, MessageID },
});
