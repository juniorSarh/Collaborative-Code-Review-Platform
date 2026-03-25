import { query } from "../config/db";
import { Submission, SubmissionStatus } from "../models/submission";

// ✅ Ensure submissions table exists
export const createSubmissionsTable = async () => {
  await query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL,
      user_id UUID NOT NULL,
      title TEXT NOT NULL,
      code_content TEXT NOT NULL,
      file_name TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_project
        FOREIGN KEY(project_id) 
        REFERENCES projects(id) 
        ON DELETE CASCADE,

      CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
    );
  `);
};

// 🔹 Create submission
export const createSubmission = async (
  projectId: string,
  userId: string,
  title: string,
  codeContent: string,
  fileName?: string
): Promise<Submission> => {
  await createSubmissionsTable();

  const res = await query(
    `INSERT INTO submissions 
     (project_id, user_id, title, code_content, file_name, status, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
     RETURNING *`,
    [projectId, userId, title, codeContent, fileName, "pending"]
  );

  return res.rows[0];
};

// 🔹 Get submission by ID
export const getSubmissionById = async (id: string): Promise<Submission | null> => {
  await createSubmissionsTable();

  const res = await query("SELECT * FROM submissions WHERE id = $1", [id]);
  return res.rows.length > 0 ? res.rows[0] : null;
};

// 🔹 Get submissions by user
export const getSubmissionsByUser = async (userId: string): Promise<Submission[]> => {
  await createSubmissionsTable();

  const res = await query(
    `SELECT s.*, p.name as project_name 
     FROM submissions s 
     JOIN projects p ON s.project_id = p.id 
     WHERE s.user_id = $1 
     ORDER BY s.created_at DESC`,
    [userId]
  );

  return res.rows;
};

// 🔹 Get submissions by project
export const getSubmissionsByProject = async (projectId: string): Promise<Submission[]> => {
  await createSubmissionsTable();

  const res = await query(
    `SELECT s.*, u.name as submitter_name, u.email as submitter_email 
     FROM submissions s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.project_id = $1 
     ORDER BY s.created_at DESC`,
    [projectId]
  );

  return res.rows;
};

// 🔹 Update submission
export const updateSubmission = async (
  id: string,
  updates: {
    title?: string;
    code_content?: string;
    file_name?: string;
    status?: SubmissionStatus;
  }
): Promise<Submission | null> => {
  await createSubmissionsTable();

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }

  if (updates.code_content !== undefined) {
    fields.push(`code_content = $${paramIndex++}`);
    values.push(updates.code_content);
  }

  if (updates.file_name !== undefined) {
    fields.push(`file_name = $${paramIndex++}`);
    values.push(updates.file_name);
  }

  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }

  if (fields.length === 0) {
    return await getSubmissionById(id);
  }

  values.push(id);

  const res = await query(
    `UPDATE submissions 
     SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramIndex} 
     RETURNING *`,
    values
  );

  return res.rows.length > 0 ? res.rows[0] : null;
};

// 🔹 Delete submission
export const deleteSubmission = async (id: string): Promise<boolean> => {
  await createSubmissionsTable();

  const res = await query("DELETE FROM submissions WHERE id = $1", [id]);
  return (res.rowCount || 0) > 0;
};

// 🔹 Check submission ownership
export const isSubmissionOwner = async (
  submissionId: string,
  userId: string
): Promise<boolean> => {
  await createSubmissionsTable();

  const res = await query(
    "SELECT 1 FROM submissions WHERE id = $1 AND user_id = $2",
    [submissionId, userId]
  );

  return res.rows.length > 0;
};

// 🔹 Check project membership
export const isProjectMember = async (
  projectId: string,
  userId: string
): Promise<boolean> => {
  const res = await query(
    `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2
     UNION
     SELECT 1 FROM projects WHERE id = $1 AND created_by = $2`,
    [projectId, userId]
  );

  return res.rows.length > 0;
};