import { filterFutureNotifications } from '../calendar/alarms';
import { CalendarNotificationSettings } from '../interfaces/calendar';
import { triggerToModel } from './notificationModel';
import { fromTriggerString } from '../calendar/vcal';
import generateUID from './generateUID';

export const notificationsToModel = (notifications: CalendarNotificationSettings[] = [], isAllDay: boolean) => {
    const modelNotifications = notifications.map(({ Type, Trigger }) => ({
        id: generateUID('notification'),
        ...triggerToModel({
            isAllDay,
            type: Type,
            trigger: fromTriggerString(Trigger),
        }),
    }));
    // Filter out future alarms
    return filterFutureNotifications(modelNotifications);
};
