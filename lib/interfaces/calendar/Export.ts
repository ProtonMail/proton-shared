import { Calendar } from './Calendar';
import { VcalVeventComponent } from './VcalModel';
import { WeekStartsOn } from '../../date-fns-utc/interface';

export enum EXPORT_STEPS {
    EXPORTING,
    FINISHED,
}

export enum EXPORT_ERRORS {
    NETWORK_ERROR,
}

export enum EXPORT_EVENT_ERRORS {
    DECRYPTION_ERROR,
    PASSWORD_RESET,
}

export type ExportError = [string, EXPORT_EVENT_ERRORS];

export interface ExportCalendarModel {
    step: EXPORT_STEPS;
    totalProcessed: VcalVeventComponent[];
    totalToProcess: number;
    calendar: Calendar;
    exportErrors: ExportError[];
    error?: EXPORT_ERRORS;
    weekStartsOn: WeekStartsOn;
    defaultTzid: string;
}
