// import { query } from "../config/database";

// export interface User {
//   id: number;
//   name: string;
//   email: string;
//   password: string;
//   role: "reviewer" | "submitter";
//   profile_picture?: string;
//   created_at: Date;
//   // note: DB table doesn't include updated_at; created_at is present
// }

// export const createUser = async (
//   name: string,
//   email: string,
//   passwordHash: string,
//   role: "reviewer" | "submitter",
//   profilePicture?: string
// ): Promise<User> => {
//   const result = await query(
//     "INSERT INTO users (name, email, password, role, profile_picture) VALUES ($1, $2, $3, $4, $5) RETURNING *",
//     [name, email, passwordHash, role, profilePicture]
//   );
//   return result.rows[0];
// };

// export const findUserByEmail = async (email: string): Promise<User | null> => {
//   const result = await query("SELECT * FROM users WHERE email = $1", [email]);
//   return result.rows[0] || null;
// };

// export const findUserById = async (id: number): Promise<User | null> => {
//   const result = await query("SELECT * FROM users WHERE id = $1", [id]);
//   return result.rows[0] || null;
// };

// export const updateUser = async (
//   id: number,
//   updates: Partial<Pick<User, "name" | "email" | "role" | "profile_picture">>
// ): Promise<User | null> => {
//   const fields = Object.keys(updates);
//   const values = Object.values(updates);
//   const setClause = fields
//     .map((field, index) => `${field} = $${index + 2}`)
//     .join(", ");
//   const result = await query(
//     `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
//     [id, ...values]
//   );
//   return result.rows[0] || null;
// };

// export const deleteUser = async (id: number): Promise<boolean> => {
//   const result = await query("DELETE FROM users WHERE id = $1", [id]);
//   return (result.rowCount ?? 0) > 0;
// };
