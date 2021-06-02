import { queryConversationCount } from '../api/conversations';
import { wait } from '../helpers/promise';
import updateCounter from '../helpers/updateCounter';

export const getConversationCountsModel = (api) => {
    return api(queryConversationCount())
        .then((result) => wait(60000).then(() => result))
        .then(({ Counts }) => Counts);
};

export const ConversationCountsModel = {
    key: 'ConversationCounts',
    get: getConversationCountsModel,
    update: updateCounter,
};
