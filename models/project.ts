export interface Project {
    id: string;
    name: string;
    description?: string;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

export interface ProjectMember {
    project_id: string;
    user_id: string;
    role: 'admin' | 'reviewer' | 'submitter';
    joined_at: Date;
}
