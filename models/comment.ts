export interface Comment {
    id: string;
    submission_id: string;
    user_id: string;
    content: string;
    line_number?: number;
    parent_comment_id?: string;
    created_at: Date;
    updated_at: Date;
}
