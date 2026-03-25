import { query } from "../config/db";
import { Project, ProjectMember } from "../models/project";

/**
 * 🧱 CREATE TABLES IF NOT EXISTS
 */
export const createProjectTables = async () => {
  // Projects table
  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_by UUID NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_project_owner
        FOREIGN KEY(created_by)
        REFERENCES users(id)
        ON DELETE CASCADE
    );
  `);

  // Project Members table
  await query(`
    CREATE TABLE IF NOT EXISTS project_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL,
      user_id UUID NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'reviewer', 'submitter')),
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_project
        FOREIGN KEY(project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

      CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

      CONSTRAINT unique_member UNIQUE(project_id, user_id)
    );
  `);
};

/**
 * Ensure tables exist
 */
const ensureTables = async () => {
  await createProjectTables();
};

// =========================
// CREATE PROJECT
// =========================
export const createProject = async (
  name: string,
  description: string,
  createdBy: string
): Promise<Project> => {
  await ensureTables();

  const res = await query(
    "INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *",
    [name, description, createdBy]
  );

  return res.rows[0];
};

// =========================
// GET PROJECT BY ID
// =========================
export const getProjectById = async (id: string): Promise<Project | null> => {
  await ensureTables();

  const res = await query("SELECT * FROM projects WHERE id = $1", [id]);
  return res.rows.length > 0 ? res.rows[0] : null;
};

// =========================
// GET PROJECTS BY USER
// =========================
export const getProjectsByUser = async (
  userId: string
): Promise<Project[]> => {
  await ensureTables();

  const res = await query(
    `SELECT p.* FROM projects p
     LEFT JOIN project_members pm ON p.id = pm.project_id
     WHERE p.created_by = $1 OR pm.user_id = $1
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [userId]
  );

  return res.rows;
};

// =========================
// UPDATE PROJECT
// =========================
export const updateProject = async (
  id: string,
  updates: Partial<Pick<Project, "name" | "description">>
): Promise<Project | null> => {
  await ensureTables();

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }

  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }

  if (fields.length === 0) {
    return await getProjectById(id);
  }

  values.push(id);

  const res = await query(
    `UPDATE projects SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return res.rows.length > 0 ? res.rows[0] : null;
};

// =========================
// DELETE PROJECT
// =========================
export const deleteProject = async (id: string): Promise<boolean> => {
  await ensureTables();

  const res = await query("DELETE FROM projects WHERE id = $1", [id]);
  return (res.rowCount || 0) > 0;
};

// =========================
// ADD MEMBER
// =========================
export const addProjectMember = async (
  projectId: string,
  userId: string,
  role: "admin" | "reviewer" | "submitter"
): Promise<ProjectMember> => {
  await ensureTables();

  const res = await query(
    `INSERT INTO project_members (project_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role
     RETURNING *`,
    [projectId, userId, role]
  );

  return res.rows[0];
};

// =========================
// REMOVE MEMBER
// =========================
export const removeProjectMember = async (
  projectId: string,
  userId: string
): Promise<boolean> => {
  await ensureTables();

  const res = await query(
    "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2",
    [projectId, userId]
  );

  return (res.rowCount || 0) > 0;
};

// =========================
// GET MEMBERS
// =========================
export const getProjectMembers = async (
  projectId: string
): Promise<ProjectMember[]> => {
  await ensureTables();

  const res = await query(
    `SELECT pm.*, u.name, u.email FROM project_members pm
     JOIN users u ON pm.user_id = u.id
     WHERE pm.project_id = $1
     ORDER BY pm.joined_at ASC`,
    [projectId]
  );

  return res.rows;
};

// =========================
// CHECK MEMBER
// =========================
export const isProjectMember = async (
  projectId: string,
  userId: string
): Promise<boolean> => {
  await ensureTables();

  const res = await query(
    "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
    [projectId, userId]
  );

  return res.rows.length > 0;
};

// =========================
// CHECK OWNER
// =========================
export const isProjectOwner = async (
  projectId: string,
  userId: string
): Promise<boolean> => {
  await ensureTables();

  const res = await query(
    "SELECT 1 FROM projects WHERE id = $1 AND created_by = $2",
    [projectId, userId]
  );

  return res.rows.length > 0;
};