import { query } from "../config/db";
import { User } from "../models/userModel";
import bcrypt from "bcryptjs";

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const res = await query("SELECT * FROM users WHERE email = $1", [email]);
  if (res.rows.length > 0) {
    return res.rows[0];
  }
  return null;
};

export const createUser = async (
  email: string,
  password: string
): Promise<User> => {
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  const res = await query(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
    [email, password_hash]
  );
  return res.rows[0];
};
