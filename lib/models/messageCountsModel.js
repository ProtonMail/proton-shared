import { queryMessageCount } from '../api/messages';
import { wait } from '../helpers/promise';
import updateCounter from '../helpers/updateCounter';

export const getMessageCountsModel = (api) => {
    return api(queryMessageCount())
        .then((result) => wait(60000).then(() => result))
        .then(({ Counts }) => Counts);
};

export const MessageCountsModel = {
    key: 'MessageCounts',
    get: getMessageCountsModel,
    update: updateCounter,
};
