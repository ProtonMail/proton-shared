// Manage imports of user emails from external providers
export const createContactsImport = (data) => ({
    url: 'contacts/v4/importers',
    method: 'post',
    data,
});

export const getContactsImports = () => ({
    url: 'contacts/v4/importers',
    method: 'get',
});

export const getContactsImport = (importID, params) => ({
    url: `contacts/v4/importers/${importID}`,
    method: 'get',
    params,
});

export const updateContactsImport = (importID, data) => ({
    url: `contacts/v4/importers/${importID}`,
    method: 'put',
    data,
});

export const deleteContactsImport = (importID) => ({
    url: `contacts/v4/importers/${importID}`,
    method: 'delete',
});

export const startContactsImportJob = (importID, data) => ({
    url: `contacts/v4/importers/${importID}`,
    method: 'post',
    data,
});

export const resumeContactsImportJob = (importID) => ({
    url: `contacts/v4/importers/${importID}/resume`,
    method: 'put',
});

export const cancelContactsImportJob = (importID) => ({
    url: `contacts/v4/importers/${importID}/cancel`,
    method: 'put',
});

// export const getContactsImportReports = () => ({
//     url: 'contacts/v4/importers/reports',
//     method: 'get',
// });

// export const deleteContactsImportReport = (reportID) => ({
//     url: `contacts/v4/importers/reports/${reportID}`,
//     method: 'delete',
// });
