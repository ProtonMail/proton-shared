import { VcalCalendarComponent, VcalVeventComponent } from './VcalModel';
import { formatData } from '../../calendar/serialize';
import { SyncMultipleApiResponses } from './Event';
import { ImportEventError } from '../../calendar/ImportEventError';
import { ImportFatalError } from '../../calendar/ImportFatalError';
import { ImportFileError } from '../../calendar/ImportFileError';
import { Calendar } from './Calendar';

export enum IMPORT_STEPS {
    ATTACHING,
    ATTACHED,
    WARNING,
    IMPORTING,
    FINISHED,
}

export interface EncryptedEvent {
    component: VcalVeventComponent;
    data: ReturnType<typeof formatData>;
}

export interface StoredEncryptedEvent extends EncryptedEvent {
    response: SyncMultipleApiResponses;
}

export interface ImportCalendarModel {
    step: IMPORT_STEPS;
    fileAttached?: File;
    eventsParsed: VcalVeventComponent[];
    totalEncrypted: number;
    totalImported: number;
    errors: ImportEventError[];
    failure?: ImportFatalError | ImportFileError | Error;
    calendar: Calendar;
    loading: boolean;
}

export type VcalCalendarComponentOrError = VcalCalendarComponent | { error: Error };
