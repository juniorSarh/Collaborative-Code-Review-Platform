import { query } from "../config/db";
import { Review, ReviewDecision } from "../models/review";

/**
 * 🧱 CREATE TABLE IF NOT EXISTS
 */
export const createReviewsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      submission_id UUID NOT NULL,
      reviewer_id UUID NOT NULL,
      decision VARCHAR(50) CHECK (decision IN ('approved', 'rejected', 'changes_requested')),
      feedback TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_submission
        FOREIGN KEY(submission_id)
        REFERENCES submissions(id)
        ON DELETE CASCADE,

      CONSTRAINT fk_reviewer
        FOREIGN KEY(reviewer_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );
  `);
};

/**
 * 👇 Ensure table exists before any operation
 */
const ensureTable = async () => {
  await createReviewsTable();
};

// =========================
// CREATE REVIEW
// =========================
export const createReview = async (
  submissionId: string,
  reviewerId: string,
  decision: ReviewDecision,
  feedback?: string
): Promise<Review> => {
  await ensureTable();

  const res = await query(
    `INSERT INTO reviews (submission_id, reviewer_id, decision, feedback, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
    [submissionId, reviewerId, decision, feedback]
  );

  return res.rows[0];
};

// =========================
// GET REVIEW BY ID
// =========================
export const getReviewById = async (id: string): Promise<Review | null> => {
  await ensureTable();

  const res = await query(
    `SELECT r.*, u.name as reviewer_name, u.email as reviewer_email 
     FROM reviews r 
     JOIN users u ON r.reviewer_id = u.id 
     WHERE r.id = $1`,
    [id]
  );

  return res.rows.length > 0 ? res.rows[0] : null;
};

// =========================
// GET REVIEWS BY SUBMISSION
// =========================
export const getReviewsBySubmission = async (
  submissionId: string
): Promise<Review[]> => {
  await ensureTable();

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

// =========================
// UPDATE REVIEW
// =========================
export const updateReview = async (
  id: string,
  decision?: ReviewDecision,
  feedback?: string
): Promise<Review | null> => {
  await ensureTable();

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
    `UPDATE reviews 
     SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return res.rows.length > 0 ? res.rows[0] : null;
};

// =========================
// DELETE REVIEW
// =========================
export const deleteReview = async (id: string): Promise<boolean> => {
  await ensureTable();

  const res = await query("DELETE FROM reviews WHERE id = $1", [id]);
  return (res.rowCount || 0) > 0;
};

// =========================
// CHECK OWNER
// =========================
export const isReviewOwner = async (
  reviewId: string,
  userId: string
): Promise<boolean> => {
  await ensureTable();

  const res = await query(
    "SELECT 1 FROM reviews WHERE id = $1 AND reviewer_id = $2",
    [reviewId, userId]
  );

  return res.rows.length > 0;
};

// =========================
// PERMISSION CHECK
// =========================
export const canReviewSubmission = async (
  submissionId: string,
  userId: string
): Promise<boolean> => {
  const res = await query(
    `SELECT 1 FROM submissions s
     JOIN projects p ON s.project_id = p.id
     LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
     WHERE s.id = $1 
     AND s.user_id != $2
     AND (
       p.created_by = $2 OR
       (pm.user_id = $2 AND pm.role IN ('admin', 'reviewer'))
     )`,
    [submissionId, userId]
  );

  return res.rows.length > 0;
};

// =========================
// AUTO UPDATE STATUS
// =========================
export const updateSubmissionStatusFromReviews = async (
  submissionId: string
): Promise<void> => {
  await ensureTable();

  const reviewsRes = await query(
    "SELECT decision FROM reviews WHERE submission_id = $1",
    [submissionId]
  );

  if (reviewsRes.rows.length === 0) return;

  const decisions = reviewsRes.rows.map((r) => r.decision);

  let newStatus: string;

  if (decisions.includes("changes_requested")) {
    newStatus = "changes_requested";
  } else if (decisions.includes("approved")) {
    newStatus = "approved";
  } else {
    newStatus = "in_review";
  }

  await query(
    "UPDATE submissions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [newStatus, submissionId]
  );
};