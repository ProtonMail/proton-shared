import { LABEL_TYPE } from '../constants';

const { MESSAGE_LABEL, MESSAGE_FOLDER, CONTACT_GROUP } = LABEL_TYPE;

export const get = (Type) => ({
    url: 'labels',
    method: 'get',
    params: { Type },
    headers: {
        'x-pm-apiversion': '4'
    }
});

export const order = ({ LabelIDs, Type }) => ({
    method: 'put',
    url: 'labels/order',
    data: { LabelIDs, Type },
    headers: {
        'x-pm-apiversion': '4'
    }
});

export const create = ({ Name, Color, Display, Type, Exclusive, Notify }) => ({
    method: 'post',
    url: 'labels',
    data: { Name, Color, Display, Type, Exclusive, Notify },
    headers: {
        'x-pm-apiversion': '4'
    }
});

export const updateLabel = (labelID, { Name, Color, Display, Notify }) => ({
    method: 'put',
    url: `labels/${labelID}`,
    data: { Name, Color, Display, Notify },
    headers: {
        'x-pm-apiversion': '4'
    }
});

export const deleteLabel = (labelID) => ({
    method: 'delete',
    url: `labels/${labelID}`,
    headers: {
        'x-pm-apiversion': '4'
    }
});

export const getLabels = () => get(MESSAGE_LABEL);
export const getFolders = () => get(MESSAGE_FOLDER);
export const getContactGroup = () => get(CONTACT_GROUP);

export const orderLabels = (opt) => order({ ...opt, Type: MESSAGE_LABEL });
export const orderContactGroup = (opt) => order({ ...opt, Type: CONTACT_GROUP });

export const createLabel = (opt) => create({ ...opt, Type: MESSAGE_LABEL });
export const createContactGroup = (opt) => create({ ...opt, Type: CONTACT_GROUP });
