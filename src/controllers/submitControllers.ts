import { Request, Response } from "express";
import { pool } from "../config/database";
// Create a submission
export const createSubmission = async (req: Request, res: Response) => {
  const { project_id, submitted_by, code, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO submissions (project_id, submitted_by, code, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [project_id, submitted_by, code, status || "pending"]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// Get all submissions
export const getAllSubmissions = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM submissions ORDER BY id ASC`
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// Get submission by ID
export const getSubmissionById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM submissions WHERE id = $1`, [
      id,
    ]);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// Delete submission
export const deleteSubmission = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM submissions WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// Update submission by ID
export const updateSubmission = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { project_id, submitted_by, code, status } = req.body;
  if (!project_id && !submitted_by && !code && !status) {
    return res
      .status(400)
      .json({ success: false, message: "No fields to update" });
  }
  try {
    const result = await pool.query(
      `UPDATE submissions
       SET project_id = COALESCE($1, project_id),
           submitted_by = COALESCE($2, submitted_by),
           code = COALESCE($3, code),
           status = COALESCE($4, status)
       WHERE id = $5
       RETURNING *`,
      [project_id, submitted_by, code, status, id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
