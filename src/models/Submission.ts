import pool from '../config/database';

export enum SubmissionStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  CHANGES_REQUESTED = 'changes_requested'
}

export interface Submission {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: SubmissionStatus;
  created_at: Date;
  updated_at: Date;
  file_path: string | null;
  file_name: string | null;
  file_type: string | null;
}

export class SubmissionModel {
  static async create(
    projectId: string,
    userId: string,
    title: string,
    description: string | null = null,
    fileInfo: { path: string; name: string; type: string } | null = null
  ): Promise<Submission> {
    const query = `
      INSERT INTO submissions 
        (project_id, user_id, title, description, file_path, file_name, file_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      projectId,
      userId,
      title,
      description,
      fileInfo?.path || null,
      fileInfo?.name || null,
      fileInfo?.type || null
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findById(id: string): Promise<Submission | null> {
    const query = 'SELECT * FROM submissions WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  static async findByProject(projectId: string): Promise<Submission[]> {
    const query = 'SELECT * FROM submissions WHERE project_id = $1 ORDER BY created_at DESC';
    const { rows } = await pool.query(query, [projectId]);
    return rows;
  }

  static async updateStatus(
    id: string,
    status: SubmissionStatus,
    userId: string
  ): Promise<Submission | null> {
    const query = `
      UPDATE submissions
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [status, id]);
    return rows[0] || null;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM submissions WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [id, userId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  static async userCanEdit(submissionId: string, userId: string): Promise<boolean> {
    const query = 'SELECT 1 FROM submissions WHERE id = $1 AND user_id = $2';
    const { rows } = await pool.query(query, [submissionId, userId]);
    return rows.length > 0;
  }
}
