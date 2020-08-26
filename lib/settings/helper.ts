import { defaultDateLocale } from '../i18n';
import { SETTINGS_WEEK_START, UserSettings } from '../interfaces';
import { WeekStartsOn } from '../date-fns-utc/interface';

export const getWeekStartsOn = ({ WeekStart }: Pick<UserSettings, 'WeekStart'>): WeekStartsOn => {
    if (WeekStart === SETTINGS_WEEK_START.LOCALE_DEFAULT) {
        const localeWeekStartsOn = defaultDateLocale?.options?.weekStartsOn;
        if (localeWeekStartsOn !== undefined && localeWeekStartsOn >= 0 && localeWeekStartsOn <= 6) {
            return localeWeekStartsOn;
        }
        return 0;
    }
    if (WeekStart >= 1 && WeekStart <= 7) {
        return (WeekStart % 7) as WeekStartsOn;
    }
    return 0;
};
