import ICAL from 'ical.js';
import { getValue } from '../../lib/contacts/property';

const getCategories = (vcard: string) => {
    const comp = new ICAL.Component(ICAL.parse(vcard));
    const properties = comp.getAllProperties() as any[];

    const property = properties[1];
    const splitProperty = property.name.split('.');
    const field = splitProperty[1] ? splitProperty[1] : splitProperty[0];
    return { property, field };
};

describe('getValue', () => {
    it('should get correct categories', () => {
        const vcard = `BEGIN:VCARD
VERSION:4.0
ITEM1.CATEGORIES:INTERNET,INFORMATION TECHNOLOGY,FINAL
END:VCARD`;

        const { property, field } = getCategories(vcard);

        const expectedCategories = ['INTERNET', 'INFORMATION TECHNOLOGY', 'FINAL'];

        expect(field).toEqual('categories');
        expect(getValue(property, field)).toEqual(expectedCategories);
    });

    it('should get correct categories with comma', () => {
        const vcard = `BEGIN:VCARD
VERSION:4.0
ITEM1.CATEGORIES:INTERNET,INFORMATION TECHNOLOGY,TEST\\,COMMA,FINAL
END:VCARD`;

        const { property, field } = getCategories(vcard);

        const expectedCategories = ['INTERNET', 'INFORMATION TECHNOLOGY', 'TEST\\,COMMA', 'FINAL'];

        expect(field).toEqual('categories');
        expect(getValue(property, field)).toEqual(expectedCategories);
    });
});
