export const noop = () => {};
export const identity = (value: any) => value;

export const debounce = (func: Function, wait: number, isImmediate?: boolean) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    return function executedFunction(this: any, ...args: any[]) {
        const context = this;

        const later = () => {
            timeoutId = undefined;
            if (!isImmediate) {
                func.apply(context, args);
            }
        };

        const shouldCallNow = isImmediate && timeoutId === undefined;

        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(later, wait);

        if (shouldCallNow) {
            func.apply(context, args);
        }
    };
};

export const throttle = (func: Function, ms = 50, context = window) => {
    let wait = false;

    return (...args: any[]) => {
        const later = () => {
            func.apply(context, args);
        };

        if (!wait) {
            later();
            wait = true;
            setTimeout(() => {
                wait = false;
            }, ms);
        }
    };
};

export function defer(cb: () => void, delay: number) {
    const id = setTimeout(() => {
        cb();
        clearTimeout(id);
    }, delay);
}

export function randomIntFromInterval(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
