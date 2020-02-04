import { LABEL_TYPE } from '../constants';

const { MESSAGE_LABEL, MESSAGE_FOLDER, CONTACT_GROUP } = LABEL_TYPE;

export const get = (Type) => ({
    url: 'v4/labels',
    method: 'get',
    params: { Type }
});

export const order = ({ LabelIDs, ParentID, Type }) => ({
    method: 'put',
    url: 'v4/labels/order',
    data: { LabelIDs, ParentID, Type }
});

export const create = ({ Name, Color, Display, Type, Notify }) => ({
    method: 'post',
    url: 'v4/labels',
    data: { Name, Color, Display, Type, Notify }
});

export const updateLabel = (labelID, { Name, Color, Notify, ParentID, Sticky, Expanded }) => ({
    method: 'put',
    url: `v4/labels/${labelID}`,
    data: { Name, Color, Notify, ParentID, Sticky, Expanded }
});

export const deleteLabel = (labelID) => ({
    method: 'delete',
    url: `v4/labels/${labelID}`
});

export const getLabels = () => get(MESSAGE_LABEL);
export const getFolders = () => get(MESSAGE_FOLDER);
export const getContactGroup = () => get(CONTACT_GROUP);

export const orderFolders = (opt) => order({ ...opt, Type: MESSAGE_FOLDER });
export const orderLabels = (opt) => order({ ...opt, Type: MESSAGE_LABEL });
export const orderContactGroup = (opt) => order({ ...opt, Type: CONTACT_GROUP });

export const createLabel = (opt) => create({ ...opt, Type: MESSAGE_LABEL });
export const createContactGroup = (opt) => create({ ...opt, Type: CONTACT_GROUP });
