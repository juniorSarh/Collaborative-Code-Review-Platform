import { query } from "../config/db";
import { User, UserRole } from "../models/user";
import bcrypt from "bcryptjs";

// ✅ Ensure table exists
const createUsersTable = async () => {
  await query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'submitter',
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// 🔹 Find user by email
export const findUserByEmail = async (email: string): Promise<User | null> => {
  await createUsersTable();

  const res = await query("SELECT * FROM users WHERE email = $1", [email]);
  return res.rows.length > 0 ? res.rows[0] : null;
};

// 🔹 Create user
export const createUser = async (
  name: string,
  email: string,
  password: string,
  role: UserRole = "submitter"
): Promise<User> => {
  await createUsersTable();

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const res = await query(
    `INSERT INTO users (name, email, password_hash, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [name, email, password_hash, role]
  );

  return res.rows[0];
};

// 🔹 Find user by ID
export const findUserById = async (id: string): Promise<User | null> => {
  await createUsersTable();

  const res = await query("SELECT * FROM users WHERE id = $1", [id]);
  return res.rows.length > 0 ? res.rows[0] : null;
};

// 🔹 Update user
export const updateUser = async (
  id: string,
  updates: Partial<Pick<User, "name" | "email" | "avatar_url">>
): Promise<User | null> => {
  await createUsersTable();

  const fields: string[] = [];
  const values: any[] = [];
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
    `UPDATE users 
     SET ${fields.join(", ")} 
     WHERE id = $${paramIndex} 
     RETURNING *`,
    values
  );

  return res.rows.length > 0 ? res.rows[0] : null;
};