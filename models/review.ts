export type ReviewDecision = 'approved' | 'changes_requested';

export interface Review {
    id: string;
    submission_id: string;
    reviewer_id: string;
    decision: ReviewDecision;
    feedback?: string;
    created_at: Date;
    updated_at: Date;
}
