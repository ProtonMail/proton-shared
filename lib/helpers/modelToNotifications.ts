import { toTriggerString } from '../calendar/vcal';
import { NotificationModel } from '../interfaces/calendar';
import { getValarmTrigger } from './getValarmTrigger';

export const modelToNotifications = (notifications: NotificationModel[] = []) => {
    return notifications.map((notificationModel) => ({
        Type: notificationModel.type,
        Trigger: toTriggerString(getValarmTrigger(notificationModel)),
    }));
};
