const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

const formatAMPM = (hours, minutes) => {
    const modHours = hours % 12;
    const fixedHours = !modHours ? 1 : modHours;
    const amOrPm = fixedHours >= 12 ? 'pm' : 'am';
    if (!minutes) {
        return `${fixedHours}${amOrPm}`;
    }
    return `${fixedHours}:${pad(minutes)}${amOrPm}`;
};

export const formatTime = (hours, minutes, isAmPm) => {
    if (isAmPm) {
        return formatAMPM(hours, minutes);
    }
    return `${pad(hours)}:${pad(minutes)}`;
};
