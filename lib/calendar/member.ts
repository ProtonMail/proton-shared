import { hasBit } from '../helpers/bitset';
import { CALENDAR_PERMISSIONS } from './constants';
import { Member } from '../interfaces/calendar';
import { Address } from '../interfaces';

export const findMemberAddressWithAdminPermissions = (Members: Member[], Addresses: Address[]) => {
    const Member = Members.find(({ Email: MemberEmail, Permissions }) => {
        return hasBit(Permissions, CALENDAR_PERMISSIONS.ADMIN) && Addresses.find(({ Email }) => MemberEmail === Email);
    });
    if (!Member) {
        throw new Error('Member with admin permission not found');
    }
    const Address = Addresses.find(({ Email }) => Member.Email === Email);
    if (!Address) {
        throw new Error('Address for member not found');
    }
    return {
        Member,
        Address
    };
};
