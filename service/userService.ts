import { query } from "../config/db";
import { User, UserRole } from "../models/user";
import bcrypt from "bcryptjs";

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const res = await query("SELECT * FROM users WHERE email = $1", [email]);
  if (res.rows.length > 0) {
    return res.rows[0];
  }
  return null;
};

export const createUser = async (
  name: string,
  email: string,
  password: string,
  role: UserRole = 'submitter'
): Promise<User> => {
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  const res = await query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *",
    [name, email, password_hash, role]
  );
  return res.rows[0];
};

export const findUserById = async (id: string): Promise<User | null> => {
  const res = await query("SELECT * FROM users WHERE id = $1", [id]);
  if (res.rows.length > 0) {
    return res.rows[0];
  }
  return null;
};

export const updateUser = async (id: string, updates: Partial<Pick<User, 'name' | 'email' | 'avatar_url'>>): Promise<User | null> => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(updates.email);
  }
  if (updates.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`);
    values.push(updates.avatar_url);
  }

  if (fields.length === 0) {
    return await findUserById(id);
  }

  values.push(id);
  const res = await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  
  if (res.rows.length > 0) {
    return res.rows[0];
  }
  return null;
};
