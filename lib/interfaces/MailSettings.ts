interface ApiMailSettings {
    DisplayName: string;
    Signature: string;
    Theme: string;
    AutoResponder: {
        StartTime: number;
        Endtime: number;
        Repeat: number;
        DaysSelected: number[];
        Subject: string;
        Message: string;
        IsEnabled: boolean;
        Zone: string;
    };
    AutoSaveContacts: number;
    AutoWildcardSearch: number;
    ComposerMode: number;
    MessageButtons: number;
    ShowImages: number;
    ShowMoved: number;
    ViewMode: number;
    ViewLayout: number;
    SwipeLeft: number;
    SwipeRight: number;
    AlsoArchive: number;
    Hotkeys: number;
    PMSignature: number;
    ImageProxy: number;
    TLS: number;
    RightToLeft: number;
    AttachPublicKey: number;
    Sign: number;
    PGPScheme: number;
    PromptPin: number;
    Autocrypt: number;
    NumMessagePerPage: number;
    DraftMIMEType: string;
    ReceiveMIMEType: string;
    ShowMIMEType: string;
    StickyLabels: number;
    ConfirmLink: number;
}

export type MailSettings = Partial<ApiMailSettings> | undefined;
