declare let clients: any;
export {};

export interface ExtendableEvent {
    waitUntil(f: any): void;
}
export interface NotificationEvent extends ExtendableEvent {
    action: string;
    notification: Notification;
}

export const notificationClickHandler = (event: NotificationEvent) => {
    const clickedNotification = event.notification;
    clickedNotification.close();

    // Do something as the result of the notification click
    const promise = clients.openWindow('/');

    event.waitUntil(promise);
};
