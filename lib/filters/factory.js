import { c } from 'ttag';

import { MAILBOX_IDENTIFIERS, FILTER_VERSION } from '../constants';
import { templates as sieveTemplates, computeFromTree, computeTree } from './sieve';

const find = (list = [], value) => list.find((item) => item.value === value);

export const getI18n = () => ({
    TYPES: [
        { label: c('Filter modal type').t('Select ...'), value: 'select' },
        { label: c('Filter modal type').t('If the subject'), value: 'subject' },
        { label: c('Filter modal type').t('If the sender'), value: 'sender' },
        { label: c('Filter modal type').t('If the recipient'), value: 'recipient' },
        { label: c('Filter modal type').t('If the attachments'), value: 'attachments' }
    ],
    COMPARATORS: [
        { label: c('Condition for custom filter').t('contains'), value: 'contains' },
        { label: c('Condition for custom filter').t('is exactly'), value: 'is' },
        { label: c('Condition for custom filter').t('begins with'), value: 'starts' },
        { label: c('Condition for custom filter').t('ends with'), value: 'ends' },
        { label: c('Condition for custom filter').t('matches'), value: 'matches' },
        {
            label: c('Condition for custom filter').t('does not contain'),
            value: '!contains'
        },
        { label: c('Condition for custom filter').t('is not'), value: '!is' },
        {
            label: c('Condition for custom filter').t('does not begin with'),
            value: '!starts'
        },
        {
            label: c('Condition for custom filter').t('does not end with'),
            value: '!ends'
        },
        {
            label: c('Condition for custom filter').t('does not match'),
            value: '!matches'
        }
    ],
    OPERATORS: [
        { label: c('Filter modal operators').t('All conditions must be fulfilled (AND)'), value: 'all' },
        { label: c('Filter modal operators').t('One condition must be fulfilled (OR)'), value: 'any' }
    ]
});

const prepareID = ({ ID = '' } = {}) => ID;
const prepareName = ({ Name = '' } = {}) => Name;
const prepareStatus = ({ Status = 1 } = {}) => Status;
const prepareVersion = ({ Version = FILTER_VERSION } = {}) => Version;
const prepareOperator = ({ Simple = {} } = {}) => {
    const { value = 'all' } = Simple.Operator || {};
    return find(getI18n().OPERATORS, value);
};

function prepareConditions({ Simple = {} } = {}) {
    const { Conditions = [] } = Simple;
    const { TYPES, COMPARATORS } = getI18n();

    const conditions = Conditions.map(({ Type = {}, Comparator = {}, Values = [], value = '' }) => ({
        value: value ? '' : value,
        Type: find(TYPES, Type.value),
        Values: value ? Values.concat(value) : Values,
        Comparator: find(COMPARATORS, Comparator.value)
    }));

    if (!conditions.length) {
        conditions.push({
            value: '',
            Values: [],
            Type: TYPES[0],
            Comparator: COMPARATORS[0]
        });
    }

    return conditions;
}

const findCurrentMoveFolder = (folders = [], list = []) => {
    const map = folders.reduce((acc, label) => ((acc[label.Name] = label), acc), {});
    const folder = list.find((key) => MAILBOX_IDENTIFIERS[key] || map[key]);
    return folder || '';
};

function prepareActionsMarkers({ Simple = {} } = {}, labels = [], folders = []) {
    const { FileInto = [], Mark = { Read: false, Starred: false }, Vacation = '' } = Simple.Actions || {};

    const move = findCurrentMoveFolder(folders, FileInto);
    const Actions = {
        Labels: labels.map((label) => {
            label.Selected = FileInto.includes(label.Name);
            return label;
        }),
        FileInto,
        Vacation,
        Mark
    };

    return {
        Actions
        // hasMove: !!move,
        // hasVacation: !!Vacation,
        // hasMark: Mark.Read || Mark.Starred,
        // hasLabels: Actions.Labels.some((label) => label.Selected)
    };
}

const prepareSieveTemplate = ({ Sieve } = {}, { Version }) => {
    return Sieve || sieveTemplates[Version] || '';
};

export const getComparator = (value) => find(getI18n().COMPARATORS, value);

function main(model = {}, mode) {
    const config = {
        ID: prepareID(model),
        Name: prepareName(model),
        Status: prepareStatus(model),
        Version: prepareVersion(model)
    };

    if (mode === 'simple') {
        return {
            ...config,
            Simple: {
                Operator: prepareOperator(model),
                Conditions: prepareConditions(model),
                ...prepareActionsMarkers(model)
            }
        };
    }

    if (mode === 'complex') {
        return {
            ...config,
            Sieve: prepareSieveTemplate(model, config)
        };
    }

    return config;
}

export const newCondition = () => {
    const {
        COMPARATORS: [Comparator],
        TYPES: [Type]
    } = getI18n();

    return {
        Type,
        Comparator,
        Values: []
    };
};

export function newFilter(filter, mode = 'simple') {
    if (filter) {
        const simple = computeFromTree(filter);
        if (!simple) {
            delete filter.Simple;
        }
        simple && (filter.Simple = simple);
        return filter;
    }

    return main(filter, mode);

    // const {
    //     OPERATORS: [Operator]
    // } = getI18n();

    // return {
    //     Name: '',
    //     Simple: {
    //         Operator,
    //         Conditions: [newCondition()],
    //         Actions: {
    //             FileInto: [],
    //             Mark: {
    //                 Read: false,
    //                 Starred: true
    //             }
    //         }
    //     }
    // };
}

export function format(filter, mode) {
    return {
        ...filter,
        Tree: computeTree(filter)
    };
}

export default main;
