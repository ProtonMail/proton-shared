/**
 * Convert Object<Boolean> to bitmap
 * @param {Object<Boolean>} o ex: { announcements: true, features: false, newsletter: false, beta: false }
 * @returns {Number} bitmap
 */
export const toBitMap = (o = {}) => Object.keys(o).reduce((acc, key, index) => acc + (o[key] << index), 0);

/**
 * Define an Object from a bitmap value
 * @param {Number} value bitmap
 * @param {Array<String>} keys ex: ['announcements', 'features', 'newsletter', 'beta']
 * @returns {Object<Boolean>} ex: { announcements: true, features: false, newsletter: false, beta: false }
 */
export const fromBitmap = (value, keys = []) =>
    keys.reduce((acc, key, index) => {
        acc[key] = !!(value & (1 << index));
        return acc;
    }, {});

/**
 * This method creates an object composed of the own and inherited enumerable property paths of object that are not omitted.
 * @param {object} model The source object.
 * @param {Array} properties Properties to omit.
 * @retuns {Object} Returns a new object.
 */
export const omit = (model, properties = []) => {
    return Object.entries(model)
        .filter(([key]) => !properties.includes(key))
        .reduce((obj, [key, val]) => Object.assign(obj, { [key]: val }), {});
};

/**
 * Review of omit function
 * @param {Object} model The source object.
 * @param {Array} properties Properties to keep.
 * @return {Object} Returns a new object.
 */
export const pick = (model, properties = []) => {
    return Object.entries(model)
        .filter(([key]) => properties.includes(key))
        .reduce((obj, [key, val]) => Object.assign(obj, { [key]: val }), {});
};

/**
 * Compare 2 objects
 * but not deeply
 * @param {Object} a
 * @param {Object} b
 * @returns {Boolean}
 */
export const isEquivalent = (a, b) => {
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
 * @param {Array} collection
 * @param {String} key
 * @returns {Object}
 */
export const toMap = (collection = [], key = 'ID') => {
    return collection.reduce((acc, item) => {
        acc[item[key]] = item;
        return acc;
    }, Object.create(null));
};

/**
 * Given two objects with the same set of keys, create an object that maps
 * the values of the first to the values of the second with the same key
 * @param {Object} obj1
 * @param {Object} obj2
 * @returns {Object}
 * @dev     Non-shared keys and respective values are ignored
 */
export const entangle = (obj1, obj2) => {
    return Object.fromEntries(Object.entries(obj1).map(([key, value]) => [value, obj2[key]]));
};
