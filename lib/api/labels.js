import { LABEL_TYPE } from '../constants';

const { MESSAGE_LABEL, MESSAGE_FOLDER, CONTACT_GROUP } = LABEL_TYPE;

export const get = (Type) => ({
    url: 'v4/labels',
    method: 'get',
    params: { Type }
});

export const order = ({ LabelIDs, Type }) => ({
    method: 'put',
    url: 'v4/labels/order',
    data: { LabelIDs, Type }
});

export const create = ({ Name, Color, Display, Type, Exclusive, Notify }) => ({
    method: 'post',
    url: 'v4/labels',
    data: { Name, Color, Display, Type, Exclusive, Notify }
});

export const updateLabel = (labelID, { Name, Color, Display, Notify }) => ({
    method: 'put',
    url: `v4/labels/${labelID}`,
    data: { Name, Color, Display, Notify }
});

export const deleteLabel = (labelID) => ({
    method: 'delete',
    url: `v4/labels/${labelID}`
});

export const getLabels = () => get(MESSAGE_LABEL);
export const getFolders = () => get(MESSAGE_FOLDER);
export const getContactGroup = () => get(CONTACT_GROUP);

export const orderLabels = (opt) => order({ ...opt, Type: MESSAGE_LABEL });
export const orderContactGroup = (opt) => order({ ...opt, Type: CONTACT_GROUP });

export const createLabel = (opt) => create({ ...opt, Type: MESSAGE_LABEL });
export const createContactGroup = (opt) => create({ ...opt, Type: CONTACT_GROUP });
