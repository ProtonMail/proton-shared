import { CALENDAR_CARD_TYPE } from '../calendar/constants';
import { CalendarEvent, SharedVcalVeventComponent } from '../interfaces/calendar';
import { unwrap } from '../calendar/helper';
import { parse } from '../calendar/vcal';

const { CLEAR_TEXT, SIGNED } = CALENDAR_CARD_TYPE;

const getComponentFromCalendarEvent = (eventData: CalendarEvent): SharedVcalVeventComponent => {
    const unencryptedPart = eventData.SharedEvents.find(({ Type }) => [CLEAR_TEXT, SIGNED].includes(Type));
    if (!unencryptedPart) {
        throw new Error('Missing unencrypted part');
    }
    return parse(unwrap(unencryptedPart.Data)) as SharedVcalVeventComponent;
};

export default getComponentFromCalendarEvent;
