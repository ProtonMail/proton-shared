export interface Folder {
    ID: string;
    Name: string;
    Color: string;
    Path?: string;
    Expanded: number;
    Type: number;
    Order: number;
    ParentID?: string;
    Notify: number;
}

export type FolderWithSubFolders = Folder & { subfolders?: Folder[] };
