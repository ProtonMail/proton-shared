import { isWithinInterval, isAfter } from 'date-fns';

import { BLACK_FRIDAY } from '../constants';

const { START, END } = BLACK_FRIDAY;

const START_DATE = new Date(Date.UTC(START.YEAR, START.MONTH, START.DAY, START.HOUR));
const END_DATE = new Date(Date.UTC(END.YEAR, END.MONTH, END.DAY, END.HOUR));

export const isBlackFridayPeriod = () => {
    return isWithinInterval(new Date(), { start: START_DATE, end: END_DATE });
};

export const isAfterBlackFriday = () => {
    return isAfter(new Date(), END_DATE);
};
