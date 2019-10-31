const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

const formatAMPM = (hours, minutes, isShortAmPm) => {
    const modHours = hours % 12;
    const fixedHours = !modHours ? 12 : modHours;
    const amOrPm = hours >= 12 ? 'pm' : 'am';
    if (!minutes && isShortAmPm) {
        return `${fixedHours}${amOrPm}`;
    }
    return `${fixedHours}:${pad(minutes)}${amOrPm}`;
};

export const formatTime = (hours = 0, minutes = 0, displayAmPm = false, isShortAmPm = false) => {
    if (displayAmPm) {
        return formatAMPM(hours, minutes, isShortAmPm);
    }
    return `${pad(hours)}:${pad(minutes)}`;
};
