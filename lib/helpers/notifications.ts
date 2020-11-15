export const hasNotificationSupport = () => {
    return 'Notification' in window;
};

export const getPermission = (): NotificationPermission => {
    if (!hasNotificationSupport()) {
        return 'denied';
    }
    return Notification.permission;
};

export const isEnabled = () => getPermission() === 'granted';

export const requestPermission = async (): Promise<NotificationPermission> => {
    const permission = getPermission();
    if (permission === 'granted') {
        return permission;
    }
    if (permission !== 'denied') {
        return Notification.requestPermission()?.catch(() => 'denied');
    }
    return 'denied';
};

interface ShowNotificationOptions extends NotificationOptions {
    useServiceWorker?: boolean;
}

export const showNotification = async (
    title = '',
    { useServiceWorker = true, ...options }: ShowNotificationOptions = {}
) => {
    if (!isEnabled() || !hasNotificationSupport()) {
        return;
    }
    if ('serviceWorker' in navigator && useServiceWorker) {
        const registration = await navigator.serviceWorker.ready;
        return registration.showNotification(title, options);
    }
    return new Notification(title, options);
};
