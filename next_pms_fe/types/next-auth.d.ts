import 'next-auth';
import 'next-auth/jwt';
import { UserRole } from './layout';

export interface BranchInfo {
    id: number | string;
    kode_cabang: string;
    nama_hotel: string;
    alamat?: string;
    timezone?: string;
    is_active?: number;
}

declare module 'next-auth' {
    interface User {
        id?: string;
        role?: string;
        user_code?: string;
        username?: string;
        name?: string;
        remember_me?: boolean;
        access_token?: string;
        refresh_token?: string;
        company_id?: number;
        company_name?: string;
        company_code?: string;
        default_branch_id?: number | string;
        default_kode_cabang?: string;
        default_branch_name?: string;
        active_branch_id?: number | string;
        active_kode_cabang?: string;
        active_branch_name?: string;
        allowed_branches?: BranchInfo[];
        allowed_kode_cabang?: string[];
        can_switch_branch?: boolean;
    }

    interface Session {
        user: {
            id?: string;
            role?: string;
            user_code?: string;
            name?: string;
            username?: string;
            company_id?: number;
            company_name?: string;
            company_code?: string;
            default_branch_id?: number | string;
            default_kode_cabang?: string;
            default_branch_name?: string;
            active_branch_id?: number | string;
            active_kode_cabang?: string;
            active_branch_name?: string;
            allowed_branches?: BranchInfo[];
            allowed_kode_cabang?: string[];
            can_switch_branch?: boolean;
        };
        remember_me?: boolean; 
        access_token?: string;
        refresh_token?: string;
        error?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?: string;
        role?: string;
        user_code?: string;
        username?: string;
        name?: string;
        access_token?: string;
        refresh_token?: string;
        access_token_expires?: number;
        error?: string;
        remember_me?: boolean;
        company_id?: number;
        company_name?: string;
        company_code?: string;
        default_branch_id?: number | string;
        default_kode_cabang?: string;
        default_branch_name?: string;
        active_branch_id?: number | string;
        active_kode_cabang?: string;
        active_branch_name?: string;
        allowed_branches?: BranchInfo[];
        allowed_kode_cabang?: string[];
        can_switch_branch?: boolean;
    }
}

export interface UserCredential {
    user_code: string;
    username: string;
    fullname: string;
    role: UserRole;
}