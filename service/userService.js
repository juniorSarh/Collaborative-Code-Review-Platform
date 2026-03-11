const { query } = require("../config/db");
const bcrypt = require("bcryptjs");

const findUserByEmail = async (email) => {
  const res = await query("SELECT * FROM users WHERE email = $1", [email]);
  if (res.rows.length > 0) {
    return res.rows[0];
  }
  return null;
};

const createUser = async (name, email, password, role = 'submitter') => {
  console.log('Creating user with params:', { name, email, password, role }); // Debug log
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  const res = await query(
    "INSERT INTO users (name, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *",
    [name, email, password_hash, role]
  );
  return res.rows[0];
};

const findUserById = async (id) => {
  const res = await query("SELECT * FROM users WHERE id = $1", [id]);
  if (res.rows.length > 0) {
    return res.rows[0];
  }
  return null;
};

const updateUser = async (id, updates) => {
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

module.exports = {
  findUserByEmail,
  createUser,
  findUserById,
  updateUser,
};
