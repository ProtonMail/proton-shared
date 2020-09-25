import { queryMailImport, queryMailImportHistory } from '../api/mailImport';
import updateCollection from '../helpers/updateCollection';

export const getImportersModel = (api) => {
    return api(queryMailImport()).then(({ Importers }) =>
        Importers.filter(({ Active }) => Active).map(({ Active, ID, Email, ImapHost, ImapPort }) => ({
            ...Active,
            ID,
            Email,
            ImapHost,
            ImapPort,
        }))
    );
};

export const getImportHistoriesModel = (api) => {
    return api(queryMailImportHistory()).then(({ Imports }) => Imports);
};

export const ImportersModel = {
    key: 'Importers',
    get: getImportersModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Importers }) => Importers }),
};

export const ImportHistoriesModel = {
    key: 'ImportHistories',
    get: getImportHistoriesModel,
    update: (model, events) => updateCollection({ model, events, item: ({ ImportHistories }) => ImportHistories }),
};
