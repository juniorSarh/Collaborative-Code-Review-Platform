import { Request, Response } from "express";
import { pool } from "../config/database";
// Create a new project
export const createProject = async (req: Request, res: Response) => {
  const { name, description, created_by } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO projects (name, description, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description, created_by]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// Get all projects
export const getAllProjects = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM projects ORDER BY id ASC`);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// Get project by ID
export const getProjectById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM projects WHERE id = $1`, [
      id,
    ]);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// Delete project
export const deleteProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM projects WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
//update
export const updateProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, created_by } = req.body;
  if (!name && !description && !created_by) {
    return res
      .status(400)
      .json({ success: false, message: "No fields to update" });
  }
  try {
    const result = await pool.query(
      `UPDATE projects
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           created_by = COALESCE($3, created_by)
       WHERE id = $4
       RETURNING *`,
      [name, description, created_by, id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
