import { query } from "../config/db";
import { Comment } from "../models/comment";

/**
 * 🧱 CREATE TABLE IF NOT EXISTS
 */
export const createCommentsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      submission_id UUID NOT NULL,
      user_id UUID NOT NULL,
      content TEXT NOT NULL,
      line_number INTEGER,
      parent_comment_id UUID,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_submission
        FOREIGN KEY(submission_id)
        REFERENCES submissions(id)
        ON DELETE CASCADE,

      CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

      CONSTRAINT fk_parent_comment
        FOREIGN KEY(parent_comment_id)
        REFERENCES comments(id)
        ON DELETE CASCADE
    );
  `);
};

/**
 * Ensure table exists
 */
const ensureTable = async () => {
  await createCommentsTable();
};

// =========================
// CREATE COMMENT
// =========================
export const createComment = async (
  submissionId: string,
  userId: string,
  content: string,
  lineNumber?: number,
  parentCommentId?: string
): Promise<Comment> => {
  await ensureTable();

  const res = await query(
    `INSERT INTO comments 
     (submission_id, user_id, content, line_number, parent_comment_id, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
     RETURNING *`,
    [submissionId, userId, content, lineNumber, parentCommentId]
  );

  return res.rows[0];
};

// =========================
// GET COMMENT BY ID
// =========================
export const getCommentById = async (
  id: string
): Promise<Comment | null> => {
  await ensureTable();

  const res = await query(
    `SELECT c.*, u.name as author_name, u.email as author_email 
     FROM comments c 
     JOIN users u ON c.user_id = u.id 
     WHERE c.id = $1`,
    [id]
  );

  return res.rows.length > 0 ? res.rows[0] : null;
};

// =========================
// GET COMMENTS BY SUBMISSION
// =========================
export const getCommentsBySubmission = async (
  submissionId: string
): Promise<Comment[]> => {
  await ensureTable();

  const res = await query(
    `SELECT c.*, u.name as author_name, u.email as author_email 
     FROM comments c 
     JOIN users u ON c.user_id = u.id 
     WHERE c.submission_id = $1 
     ORDER BY c.line_number ASC NULLS LAST, c.created_at ASC`,
    [submissionId]
  );

  return res.rows;
};

// =========================
// UPDATE COMMENT
// =========================
export const updateComment = async (
  id: string,
  content: string
): Promise<Comment | null> => {
  await ensureTable();

  const res = await query(
    `UPDATE comments 
     SET content = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 
     RETURNING *`,
    [content, id]
  );

  return res.rows.length > 0 ? res.rows[0] : null;
};

// =========================
// DELETE COMMENT
// =========================
export const deleteComment = async (id: string): Promise<boolean> => {
  await ensureTable();

  const res = await query("DELETE FROM comments WHERE id = $1", [id]);
  return (res.rowCount || 0) > 0;
};

// =========================
// CHECK OWNER
// =========================
export const isCommentOwner = async (
  commentId: string,
  userId: string
): Promise<boolean> => {
  await ensureTable();

  const res = await query(
    "SELECT 1 FROM comments WHERE id = $1 AND user_id = $2",
    [commentId, userId]
  );

  return res.rows.length > 0;
};

// =========================
// ACCESS CONTROL
// =========================
export const canAccessSubmission = async (
  submissionId: string,
  userId: string
): Promise<boolean> => {
  const res = await query(
    `SELECT 1 FROM submissions s
     WHERE s.id = $1 AND (
       s.user_id = $2 OR
       EXISTS (
         SELECT 1 FROM project_members pm 
         WHERE pm.project_id = s.project_id AND pm.user_id = $2
       ) OR
       EXISTS (
         SELECT 1 FROM projects p 
         WHERE p.id = s.project_id AND p.created_by = $2
       )
     )`,
    [submissionId, userId]
  );

  return res.rows.length > 0;
};

// =========================
// THREADED COMMENTS
// =========================
export const getThreadedComments = async (
  submissionId: string
): Promise<any[]> => {
  const comments = await getCommentsBySubmission(submissionId);

  const commentMap = new Map();
  const rootComments: any[] = [];

  // First pass
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass
  comments.forEach((comment) => {
    const current = commentMap.get(comment.id);

    if (comment.parent_comment_id) {
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        parent.replies.push(current);
      }
    } else {
      rootComments.push(current);
    }
  });

  return rootComments;
};