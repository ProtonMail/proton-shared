/**
 * Pending date-fn to implement UTC functions https://github.com/date-fns/date-fns/issues/376
 */
export { default as eachDayOfInterval } from './eachDayOfInterval';
export { default as startOfDay } from './startOfDay';
export { default as endOfDay } from './endOfDay';
export { default as getWeekNumber } from './getWeekNumber';
export { default as differenceInCalendarDays } from './differenceInCalendarDays';

export const min = (a, b) => {
    return +a > +b ? b : a;
};

export const max = (a, b) => {
    return +a > +b ? a : b;
};

export const addMilliseconds = (date, amount) => new Date(date.getTime() + amount);

export const MILLISECONDS_IN_MINUTE = 60000;
export const addMinutes = (date, amount) => addMilliseconds(date, amount * MILLISECONDS_IN_MINUTE);

export const addDays = (date, amount) => {
    const result = new Date(date);
    result.setUTCDate(date.getUTCDate() + amount);
    return result;
};

export { default as format } from './format';
