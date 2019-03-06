export const queryEmails = (data) => ({
    url: 'contacts/emails',
    method: 'get',
    data
});

export const getContacts = ({ Page = 0, PageSize = 1000, LabelID = '' }) => ({
    url: `contacts/?${PageID},${PageSize},${LabelID}`,
    method: 'get',
});

export const getContactExport = ({ Page = 0, PageSize = 1000, LabelID = '' }) => ({
    url: `contacts/export${PageID},${PageSize},${LabelID}`,
    method: 'get',
    data: { Code, Contacts, Total },
});

export const getContact = ({ contactID }) => ({
    url: `contacts/${contactID}`,
    method: 'get',
});

export const addContacts = ({ Contacts, Overwrite, Labels }) => ({
    url: 'contacts',
    method: 'post',
    data: { Contacts, Overwrite, Labels },
});

export const updateContact = (contactID, { Cards }) => ({
    url: `contacts/?${contactID}`,
    method: 'put',
    data: { Cards },
});

export const labelContacts = ({ labelID, contactIDs }) => ({
    url: `contacts/label`,
    method: 'put',
    data: { labelID, contactIDs },
});

export const unLabelContacts = ({ labelID, contactIDs }) => ({
    url: `contacts/unlabel`,
    method: 'put',
    data: { labelID, contactIDs },
});

export const deleteContacts = ({ IDs }) => ({
    url: `contacts/delete`,
    method: 'put',
    data: { IDs },
});

export const clearContacts = () => ({
    url: `contacts`,
    method: 'delete',
});

export const getContactEmails = ({ Page = 0, PageSize = 1000, Email = '', LabelID = '' }) => ({
    url: `contacts/emails?${PageID},${PageSize},${Email},${LabelID}`,
    method: 'get',
});

export const labelContactEmails = ({ labelID, contactEmailIDs }) => ({
    url: `contacts/emails/label`,
    method: 'put',
    data: { labelID, contactEmailIDs },
});

export const unLabelContactEmails = ({ labelID, contactEmailIDs }) => ({
    url: `contacts/emails/unlabel`,
    method: 'put',
    data: { labelID, contactEmailIDs },
});
