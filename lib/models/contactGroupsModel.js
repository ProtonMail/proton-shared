import { getContactGroup } from '../api/labels';
import updateCollection from '../helpers/updateCollection';

export const getContactGroupsModel = (api) => {
    return api(getContactGroup()).then(({ Labels }) => Labels);
};

export const ContactGroupsModel = {
    key: 'ContactGroups',
    get: getContactGroupsModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Label }) => Label })
};
