import { queryMailImport, queryMailImportHistory } from '../api/mailImport';
import updateCollection from '../helpers/updateCollection';

export const getImportersModel = (api) => {
    return api(queryMailImport()).then(({ Importers }) =>
        Importers.filter(({ Active ) => Active).map(({ Active, ID, Email, ImapHost, ImapPort }) => ({
            ...i.Active,
            ID: i.ID,
            Email: i.Email,
            ImapHost: i.ImapHost,
            ImapPort: `${i.ImapPort}`,
        }))
    );
};

export const getImportHistoryModel = (api) => {
    return api(queryMailImportHistory()).then(({ Imports }) => Imports);
};

export const ImportersModel = {
    key: 'Importers',
    get: getImportersModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Importers }) => Importers }),
};

export const ImportHistoryModel = {
    key: 'ImportHistories',
    get: getImportHistoryModel,
    update: (model, events) => updateCollection({ model, events, item: ({ ImportHistories }) => ImportHistories }),
};
