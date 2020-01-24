/**
 * Convert Record<string, boolean> to bitmap
 * @param o ex: { announcements: true, features: false, newsletter: false, beta: false }
 * @returns bitmap
 */
export const toBitMap = (o: Record<string, boolean> = {}) =>
    Object.keys(o).reduce((acc, key, index) => acc + (Number(o[key]) << index), 0);

/**
 * Define an Object from a bitmap value
 * @param value bitmap
 * @param keys ex: ['announcements', 'features', 'newsletter', 'beta']
 * @returns ex: { announcements: true, features: false, newsletter: false, beta: false }
 */
export const fromBitmap = (value: number, keys: string[] = []): Record<string, boolean> =>
    keys.reduce((acc, key, index) => {
        acc[key] = !!(value & (1 << index));
        return acc;
    }, {} as any);

/**
 * This method creates an object composed of the own and inherited enumerable property paths of object that are not omitted.
 * @param model The source object.
 * @param properties Properties to omit.
 * @retuns Returns a new object.
 */
export const omit = <T extends object, K extends keyof T>(
    model: T,
    properties: K[] = []
): { [k in Exclude<keyof T, K>]: T[k] } =>
    Object.entries(model)
        .filter(([key]) => !properties.includes(key as K))
        .reduce((obj, [key, val]) => Object.assign(obj, { [key]: val }), {} as any);

/**
 * Review of omit function
 * @param model The source object.
 * @param properties Properties to keep.
 * @return Returns a new object.
 */
export const pick = <T extends object, K extends keyof T>(
    model: T,
    properties: K[] = []
): { [k in Extract<keyof T, K>]: T[k] } =>
    Object.entries(model)
        .filter(([key]) => properties.includes(key as K))
        .reduce((obj, [key, val]) => Object.assign(obj, { [key]: val }), {} as any);

/**
 * Compare 2 objects but not deeply
 */
export const isEquivalent = (a: Record<string, any>, b: Record<string, any>) => {
    const aProps = Object.getOwnPropertyNames(a);
    const bProps = Object.getOwnPropertyNames(b);

    if (aProps.length !== bProps.length) {
        return false;
    }

    for (let i = 0; i < aProps.length; i++) {
        const propName = aProps[i];

        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    return true;
};

/**
 * Create a map from a collection
 */
export const toMap = <T extends Record<string, any>, K extends keyof T>(
    collection: T[] = [],
    key: K = 'ID' as K
): Record<T[K], T> =>
    collection.reduce((acc, item) => {
        acc[item[key]] = item;
        return acc;
    }, Object.create(null));
