import { MINUTE } from '../constants';

/**
 * @param left      Later date
 * @param right     Earlier date
 */
const differenceInMinutes = (left: Date, right: Date) => {
    const diff = left.getTime() - right.getTime();

    return Math.round(diff / MINUTE);
};

export default differenceInMinutes;
