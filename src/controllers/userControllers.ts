import { Request, Response } from "express";
import { pool } from "../config/database";
// Create a new user
export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, password, role || "submitter"]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// Get all users
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM users ORDER BY id ASC`);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// Get a single user by ID
export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// Update user by ID
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role, profile_picture } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           role = COALESCE($3, role),
           profile_picture = COALESCE($4, profile_picture)
       WHERE id = $5
       RETURNING *`,
      [name, email, role, profile_picture, id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
