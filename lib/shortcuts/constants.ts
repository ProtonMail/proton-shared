import { c } from 'ttag';
import { APPS, APP_NAMES } from '../constants';
import { isMac } from '../helpers/browser';

export const getShortcutsForApp = (app: APP_NAMES) => {
    const IS_MAC = isMac();
    const META_KEY = IS_MAC ? '⌘' : 'Ctrl';

    switch (app) {
        case APPS.PROTONMAIL:
            return [
                {
                    name: c('Shortcut section name').t`Basic navigation`,
                    alwaysActive: true,
                    shortcuts: [
                        {
                            name: c('Shortcut name').t`Move up`,
                            keys: '↑',
                        },
                        {
                            name: c('Shortcut name').t`Jump to first`,
                            keys: `${META_KEY} + ↑`,
                        },
                        {
                            name: c('Shortcut name').t`Move down`,
                            keys: '↓',
                        },
                        {
                            name: c('Shortcut name').t`Jump to last`,
                            keys: `${META_KEY} + ↓`,
                        },
                        {
                            name: c('Shortcut name').t`Move right / expand`,
                            keys: '→',
                        },
                        {
                            name: c('Shortcut name').t`Move left / collapse`,
                            keys: '←',
                        },
                    ],
                },
                {
                    name: c('Shortcut section name').t`Basic actions`,
                    alwaysActive: true,
                    shortcuts: [
                        {
                            name: c('Shortcut name').t`Apply / open`,
                            keys: 'Enter',
                        },
                        {
                            name: c('Shortcut name').t`Cancel / close`,
                            keys: 'Escape',
                        },
                        {
                            name: c('Shortcut name').t`Open this modal`,
                            keys: '?',
                        },
                        {
                            name: c('Shortcut name').t`Search`,
                            keys: '/',
                        },
                        // {
                        //     name: c('Shortcut name').t`Launch command line`,
                        //     keys: `${META_KEY} + K`,
                        // },
                    ],
                },
                {
                    name: c('Shortcut section name').t`Folder shortcuts`,
                    shortcuts: [
                        {
                            name: c('Shortcut name').t`Go to Inbox`,
                            keys: ['G', 'I'],
                        },
                        {
                            name: c('Shortcut name').t`Go to Archive`,
                            keys: ['G', 'A'],
                        },
                        {
                            name: c('Shortcut name').t`Go to Sent`,
                            keys: ['G', 'E'],
                        },
                        {
                            name: c('Shortcut name').t`Go to Starred`,
                            keys: ['G', '*'],
                        },
                        {
                            name: c('Shortcut name').t`Go to Drafts`,
                            keys: ['G', 'D'],
                        },
                        {
                            name: c('Shortcut name').t`Go to Trash`,
                            keys: ['G', 'T'],
                        },
                        {
                            name: c('Shortcut name').t`Go to Spam`,
                            keys: ['G', 'S'],
                        },
                        {
                            name: c('Shortcut name').t`Go to All Mail`,
                            keys: ['G', 'M'],
                        },
                    ],
                },
                {
                    name: c('Shortcut section name').t`Composer shortcuts`,
                    shortcuts: [
                        {
                            name: c('Shortcut name').t`Close draft`,
                            keys: `${META_KEY} + W`,
                        },
                        {
                            name: c('Shortcut name').t`Minimize composer`,
                            keys: `${META_KEY} + M`,
                        },
                        {
                            name: c('Shortcut name').t`Insert file`,
                            keys: `${META_KEY} + I`,
                        },
                        {
                            name: c('Shortcut name').t`Save draft`,
                            keys: `${META_KEY} + S`,
                        },
                        {
                            name: c('Shortcut name').t`Send email`,
                            keys: `${META_KEY} + Enter`,
                        },
                        {
                            name: c('Shortcut name').t`Add expiration time`,
                            keys: `${META_KEY} + Shift + X`,
                        },
                        {
                            name: c('Shortcut name').t`Add encryption`,
                            keys: `${META_KEY} + Shift + E`,
                        },
                        {
                            name: c('Shortcut name').t`Discard draft`,
                            keys: `${META_KEY} + Backspace`,
                        },
                        // {
                        //     name: c('Shortcut name').t`Undo send`,
                        //     keys: `${META_KEY} + Z`,
                        // },
                    ],
                },
                {
                    name: c('Shortcut section name').t`List shortcuts`,
                    shortcuts: [
                        {
                            name: c('Shortcut name').t`Show unread emails`,
                            keys: 'Shift + U',
                        },
                        {
                            name: c('Shortcut name').t`Show read emails`,
                            keys: 'Shift + R',
                        },
                        {
                            name: c('Shortcut name').t`Show all emails`,
                            keys: 'Shift + A',
                        },
                        {
                            name: c('Shortcut name').t`Select / unselect`,
                            keys: 'Space or X',
                        },
                        {
                            name: c('Shortcut name').t`Select / unselect all`,
                            keys: `${META_KEY} + A`,
                        },
                    ],
                },
                {
                    name: c('Shortcut section name').t`Action shortcuts`,
                    shortcuts: [
                        {
                            name: c('Shortcut name').t`New message`,
                            keys: 'N',
                        },
                        {
                            name: c('Shortcut name').t`Star`,
                            keys: '*',
                        },
                        {
                            name: c('Shortcut name').t`Mark as unread`,
                            keys: 'U',
                        },
                        {
                            name: c('Shortcut name').t`Label as...`,
                            keys: 'L',
                        },
                        {
                            name: c('Shortcut name').t`Create filter with...`,
                            keys: 'F',
                        },
                        {
                            name: c('Shortcut name').t`Move to...`,
                            keys: 'M',
                        },
                        {
                            name: c('Shortcut name').t`Move to Inbox`,
                            keys: 'I',
                        },
                        {
                            name: c('Shortcut name').t`Move to Archive`,
                            keys: 'A',
                        },
                        {
                            name: c('Shortcut name').t`Move to Spam`,
                            keys: 'S',
                        },
                        {
                            name: c('Shortcut name').t`Move to Trash`,
                            keys: 'T',
                        },
                        {
                            name: c('Shortcut name').t`Delete permanently`,
                            keys: `${META_KEY} + Backspace`,
                        },
                        {
                            name: c('Shortcut name').t`Empty folder`,
                            keys: `${META_KEY} + Shift + Backspace`,
                        },
                        // {
                        //     name: c('Shortcut name').t`Undo action`,
                        //     keys: `${META_KEY} + Z`,
                        // },
                    ],
                },
                {
                    name: c('Shortcut section name').t`Message shortcuts`,
                    shortcuts: [
                        {
                            name: c('Shortcut name').t`Reply`,
                            keys: 'R',
                        },
                        {
                            name: c('Shortcut name').t`Reply all`,
                            keys: 'Shift + R',
                        },
                        {
                            name: c('Shortcut name').t`Forward`,
                            keys: 'Shift + F',
                        },
                        {
                            name: c('Shortcut name').t`Load remote content`,
                            keys: 'Shift + C',
                        },
                        {
                            name: c('Shortcut name').t`Load embedded images`,
                            keys: 'Shift + E',
                        },
                        {
                            name: c('Shortcut name').t`Show original message`,
                            keys: 'O',
                        },
                    ],
                },
            ];
        default:
            return [];
    }
};
