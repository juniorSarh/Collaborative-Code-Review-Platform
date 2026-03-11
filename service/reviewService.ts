import { query } from "../config/db";
import { Review, ReviewDecision } from "../models/review";

export const createReview = async (
  submissionId: string,
  reviewerId: string,
  decision: ReviewDecision,
  feedback?: string
): Promise<Review> => {
  const res = await query(
    `INSERT INTO reviews (submission_id, reviewer_id, decision, feedback, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
    [submissionId, reviewerId, decision, feedback]
  );
  return res.rows[0];
};

export const getReviewById = async (id: string): Promise<Review | null> => {
  const res = await query(
    `SELECT r.*, u.name as reviewer_name, u.email as reviewer_email 
     FROM reviews r 
     JOIN users u ON r.reviewer_id = u.id 
     WHERE r.id = $1`,
    [id]
  );
  if (res.rows.length > 0) {
    return res.rows[0];
  }
  return null;
};

export const getReviewsBySubmission = async (submissionId: string): Promise<Review[]> => {
  const res = await query(
    `SELECT r.*, u.name as reviewer_name, u.email as reviewer_email 
     FROM reviews r 
     JOIN users u ON r.reviewer_id = u.id 
     WHERE r.submission_id = $1 
     ORDER BY r.created_at DESC`,
    [submissionId]
  );
  return res.rows;
};

export const updateReview = async (
  id: string,
  decision?: ReviewDecision,
  feedback?: string
): Promise<Review | null> => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (decision !== undefined) {
    fields.push(`decision = $${paramIndex++}`);
    values.push(decision);
  }
  if (feedback !== undefined) {
    fields.push(`feedback = $${paramIndex++}`);
    values.push(feedback);
  }

  if (fields.length === 0) {
    return await getReviewById(id);
  }

  values.push(id);
  const res = await query(
    `UPDATE reviews SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  
  if (res.rows.length > 0) {
    return res.rows[0];
  }
  return null;
};

export const deleteReview = async (id: string): Promise<boolean> => {
  const res = await query("DELETE FROM reviews WHERE id = $1", [id]);
  return (res.rowCount || 0) > 0;
};

export const isReviewOwner = async (reviewId: string, userId: string): Promise<boolean> => {
  const res = await query(
    "SELECT 1 FROM reviews WHERE id = $1 AND reviewer_id = $2",
    [reviewId, userId]
  );
  return res.rows.length > 0;
};

export const canReviewSubmission = async (submissionId: string, userId: string): Promise<boolean> => {
  const res = await query(
    `SELECT 1 FROM submissions s
     JOIN projects p ON s.project_id = p.id
     LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
     WHERE s.id = $1 
     AND s.user_id != $2  -- Can't review own submission
     AND (
       p.created_by = $2 OR  -- Project owner can review
       (pm.user_id = $2 AND pm.role IN ('admin', 'reviewer'))  -- Admin/reviewer members can review
     )`,
    [submissionId, userId]
  );
  return res.rows.length > 0;
};

export const updateSubmissionStatusFromReviews = async (submissionId: string): Promise<void> => {
  // Get all reviews for the submission
  const reviewsRes = await query(
    "SELECT decision FROM reviews WHERE submission_id = $1",
    [submissionId]
  );
  
  if (reviewsRes.rows.length === 0) {
    return; // No reviews, no status change
  }
  
  const decisions = reviewsRes.rows.map(r => r.decision);
  const hasChangesRequested = decisions.includes('changes_requested');
  const hasApproved = decisions.includes('approved');
  
  let newStatus: string;
  
  if (hasChangesRequested) {
    newStatus = 'changes_requested';
  } else if (hasApproved) {
    newStatus = 'approved';
  } else {
    newStatus = 'in_review';
  }
  
  // Update submission status
  await query(
    "UPDATE submissions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [newStatus, submissionId]
  );
};
