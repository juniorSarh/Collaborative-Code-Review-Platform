import { Request, Response } from "express";
import { pool } from "../config/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const SALT_ROUNDS = 10;
// REGISTER
export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
      [name, email, hashedPassword, role || "submitter"]
    );
    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};
// LOGIN
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);
    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    res.status(200).json({ success: true, token });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
