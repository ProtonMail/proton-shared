import { normalizeEmail, normalizeInternalEmail, parseMailtoURL, validateEmailAddress } from '../../lib/helpers/email';

describe('email', () => {
    describe('validateEmailAddress', () => {
        it('should validate good email addresses', () => {
            const emails = [
                'test@protonmail.com',
                '(comment)test+test(ot@" her)@pm.me',
                'test@[192.168.1.1]',
                'test(rare)@[192.168.12.23]',
                '(comment)"te@ st"(rare)@[192.168.12.23]',
                "weird!#$%&'*+-/=?^_`{|}~123@pa-ta-Ton32.com.edu.org"
            ];
            expect(emails.map((email) => validateEmailAddress(email)).filter(Boolean).length).toBe(emails.length);
        });

        it('should not validate malformed email addresses', () => {
            const emails = [
                'hello',
                'hello.@test.com',
                'he..lo@test.com',
                '.hello@test.com',
                'test@[192.168.1.1.2]',
                'test(rare)@[19245.168.12.23]',
                'test@domain',
                'test@domain.b',
                'test@-domain.com',
                'test@domain-.com',
                'test@test@domain.com',
                'français@baguette.fr',
                'ezpaña@espain.es'
            ];
            expect(emails.map((email) => validateEmailAddress(email)).filter(Boolean).length).toBe(0);
        });
    });

    describe('normalizeEmail', () => {
        it('should leave external emails the same', () => {
            const emails = ['testing@myDomain', 'TeS.--TinG@MYDOMAIN', 'ABC;;@cde', 'bad@email@this.is'];
            expect(emails.map((email) => normalizeEmail(email))).toEqual(emails);
            expect(emails.map((email) => normalizeEmail(email, false))).toEqual(emails);
        });

        it('should normalize internal emails properly', () => {
            const emails = [
                'testing@pm.me',
                'TeS.--TinG@PM.ME',
                'ABC;;@pm.me',
                'mo____.-..reTes--_---ting@pm.me',
                'bad@email@this.is'
            ];
            const normalized = [
                'testing@pm.me',
                'testing@PM.ME',
                'abc;;@pm.me',
                'moretesting@pm.me',
                'bad@email@this.is'
            ];
            expect(emails.map((email) => normalizeEmail(email, true))).toEqual(normalized);
            expect(emails.map(normalizeInternalEmail)).toEqual(normalized);
        });
    });

    describe('parseMailtoURL', () => {
        it('should extract all "to emails" from the mailtoURL', () => {
            const mailtoURLs = [
                'mailTo:addr1@an.example',
                'mailto:infobot@example.com?body=send%20current-issue',
                'mailto:?to=addr1@an.example,addr2@an.example',
                'mailto:list@example.org?In-Reply-To=%3C3469A91.D10AF4C@example.com%3E',
                'mailto:addr1@an.example,addr2@an.example?to=addr3@an.example,addr4@an.example'
            ];
            const expected = [
                ['addr1@an.example'],
                ['infobot@example.com'],
                ['addr1@an.example', 'addr2@an.example'],
                ['list@example.org'],
                ['addr1@an.example', 'addr2@an.example', 'addr3@an.example', 'addr4@an.example']
            ];
            expect(mailtoURLs.map(parseMailtoURL)).toEqual(expected.map((to) => ({ to })));
        });
    });
});
