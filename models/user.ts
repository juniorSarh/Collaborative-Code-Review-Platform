export type UserRole = 'admin' | 'reviewer' | 'submitter';

export interface User {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    role: UserRole;
    avatar_url?: string;
    created_at: Date;
    updated_at: Date;
}
