export const queryEmails = (data) => ({
    url: 'contacts/emails',
    method: 'get',
    data
});

export const queryContacts = ({ Page = 0, PageSize = 1000, LabelID = '' }) => ({
    url: `contacts`,
    method: 'get',
    params: { PageID, PageSize, LabelID },
});

export const getContactExport = ({ Page = 0, PageSize = 1000, LabelID = '' }) => ({
    url: `contacts/export`,
    method: 'get',
    params: { PageID, PageSize, LabelID },
});

export const getContact = (contactID) => ({
    url: `contacts/${contactID}`,
    method: 'get',
});

export const addContacts = ({ Contacts, Overwrite, Labels }) => ({
    url: 'contacts',
    method: 'post',
    data: { Contacts, Overwrite, Labels },
});

export const updateContact = (contactID, { Cards }) => ({
    url: `contacts/${contactID}`,
    method: 'put',
    data: { Cards },
});

export const labelContacts = ({ labelID, contactIDs }) => ({
    url: 'contacts/label',
    method: 'put',
    data: { labelID, contactIDs },
});

export const unLabelContacts = ({ labelID, contactIDs }) => ({
    url: 'contacts/unlabel',
    method: 'put',
    data: { labelID, contactIDs },
});

export const deleteContacts = (IDs) => ({
    url: 'contacts/delete',
    method: 'put',
    data: { IDs },
});

export const clearContacts = () => ({
    url: 'contacts',
    method: 'delete',
});

export const getContactEmails = ({ Page = 0, PageSize = 1000, Email = '', LabelID = '' }) => ({
    url: `contacts/emails`,
    method: 'get',
    params: { Page, PageSize, Email, LabelID}
});

export const labelContactEmails = ({ LabelID, ContactEmailIDs }) => ({
    url: 'contacts/emails/label',
    method: 'put',
    data: { LabelID, ContactEmailIDs },
});

export const unLabelContactEmails = ({ LabelID, ContactEmailIDs }) => ({
    url: 'contacts/emails/unlabel',
    method: 'put',
    data: { LabelID, ContactEmailIDs },
});
