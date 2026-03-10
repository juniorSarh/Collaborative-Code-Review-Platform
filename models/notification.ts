export type NotificationType = 'comment_added' | 'review_submitted' | 'submission_approved' | 'changes_requested' | 'project_assigned';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    content: string;
    related_entity_type?: string;
    related_entity_id?: string;
    is_read: boolean;
    created_at: Date;
}
