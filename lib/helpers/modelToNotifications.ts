import { toTriggerString } from '../calendar/vcal';
import { NotificationModel } from '../interfaces/calendar/Notification';
import { getValarmTrigger } from '../../../proton-calendar/src/app/components/eventModal/eventForm/getValarmTrigger';

export const modelToNotifications = (notifications: NotificationModel[] = []) => {
    return notifications.map((notificationModel) => ({
        Type: notificationModel.type,
        Trigger: toTriggerString(getValarmTrigger(notificationModel)),
    }));
};
