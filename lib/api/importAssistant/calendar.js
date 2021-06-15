// Manage imports of user emails from external providers
export const createCalendarImport = (data) => ({
    url: 'calendar/v1/importers',
    method: 'post',
    data,
});

export const getCalendarImports = () => ({
    url: 'calendar/v1/importers',
    method: 'get',
});

export const getCalendarImport = (importID, params) => ({
    url: `calendar/v1/importers/${importID}`,
    method: 'get',
    params,
});

export const updateCalendarImport = (importID, data) => ({
    url: `calendar/v1/importers/${importID}`,
    method: 'put',
    data,
});

export const deleteCalendarImport = (importID) => ({
    url: `calendar/v1/importers/${importID}`,
    method: 'delete',
});

export const startCalendarImportJob = (importID, data) => ({
    url: `calendar/v1/importers/${importID}`,
    method: 'post',
    data,
});

export const resumeCalendarImportJob = (importID) => ({
    url: `calendar/v1/importers/${importID}/resume`,
    method: 'put',
});

export const cancelCalendarImportJob = (importID) => ({
    url: `calendar/v1/importers/${importID}/cancel`,
    method: 'put',
});

// export const getCalendarImportReports = () => ({
//     url: 'calendar/v1/importers/reports',
//     method: 'get',
// });

// export const deleteCalendarImportReport = (reportID) => ({
//     url: `calendar/v1/importers/reports/${reportID}`,
//     method: 'delete',
// });
