import { OpenPGPSignature } from 'pmcrypto';
import { VcalAttendeeProperty, VcalAttendeePropertyParameters } from '../interfaces/calendar/VcalModel';
import {
    DAILY_TYPE,
    END_TYPE,
    FREQUENCY,
    MONTHLY_TYPE,
    WEEKLY_TYPE,
    YEARLY_TYPE,
    ATTENDEE_STATUS_API,
} from './constants';

export interface EncryptPartResult {
    dataPacket: Uint8Array;
    signature: OpenPGPSignature;
}

export interface SignPartResult {
    data: string;
    signature: OpenPGPSignature;
}

export interface AttendeeClearPartResult {
    permissions: number;
    status: ATTENDEE_STATUS_API;
    token: string;
}

interface AttendeeParameters extends VcalAttendeePropertyParameters {
    'x-pm-token': string;
}
export interface AttendeePart extends VcalAttendeeProperty {
    parameters: AttendeeParameters;
}

export interface FrequencyModel {
    type: FREQUENCY;
    frequency: FREQUENCY;
    interval?: number;
    daily: {
        type: DAILY_TYPE;
    };
    weekly: {
        type: WEEKLY_TYPE;
        days: number[];
    };
    monthly: {
        type: MONTHLY_TYPE;
    };
    yearly: {
        type: YEARLY_TYPE;
    };
    ends: {
        type: END_TYPE;
        count?: number;
        until?: Date;
    };
}

export interface DateTimeModel {
    date: Date;
    time: Date;
    tzid: string;
}

export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;
