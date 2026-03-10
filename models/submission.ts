export type SubmissionStatus = 'pending' | 'in_review' | 'approved' | 'changes_requested';

export interface Submission {
    id: string;
    project_id: string;
    user_id: string;
    title: string;
    code_content: string;
    file_name?: string;
    status: SubmissionStatus;
    created_at: Date;
    updated_at: Date;
}
