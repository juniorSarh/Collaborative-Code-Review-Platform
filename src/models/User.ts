import bcrypt from 'bcryptjs';
import pool from '../config/database';

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  REVIEWER = 'reviewer',
  SUBMITTER = 'submitter',
}

export type UserRoleType = keyof typeof UserRole;

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async create(
    email: string,
    password: string,
    role: UserRole = UserRole.SUBMITTER,
    name: string | null = null,
    avatarUrl: string | null = null
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (email, password_hash, name, avatar_url, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [email, hashedPassword, name, avatarUrl, role];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  static async updateProfile(
    id: string,
    updates: { name?: string; avatar_url?: string }
  ): Promise<User> {
    const { name, avatar_url } = updates;
    const query = `
      UPDATE users 
      SET 
        name = COALESCE($1, name),
        avatar_url = COALESCE($2, avatar_url),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const { rows } = await pool.query(query, [name, avatar_url, id]);
    return rows[0];
  }

  static async changePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, id]
    );
  }
}
