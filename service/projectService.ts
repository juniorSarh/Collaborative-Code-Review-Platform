import { query } from "../config/db";
import { Project, ProjectMember } from "../models/project";

export const createProject = async (name: string, description: string, createdBy: string): Promise<Project> => {
  const res = await query(
    "INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *",
    [name, description, createdBy]
  );
  return res.rows[0];
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  const res = await query("SELECT * FROM projects WHERE id = $1", [id]);
  if (res.rows.length > 0) {
    return res.rows[0];
  }
  return null;
};

export const getProjectsByUser = async (userId: string): Promise<Project[]> => {
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

export const updateProject = async (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>): Promise<Project | null> => {
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
    `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  
  if (res.rows.length > 0) {
    return res.rows[0];
  }
  return null;
};

export const deleteProject = async (id: string): Promise<boolean> => {
  const res = await query("DELETE FROM projects WHERE id = $1", [id]);
  return (res.rowCount || 0) > 0;
};

export const addProjectMember = async (projectId: string, userId: string, role: 'admin' | 'reviewer' | 'submitter'): Promise<ProjectMember> => {
  const res = await query(
    "INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *",
    [projectId, userId, role]
  );
  return res.rows[0];
};

export const removeProjectMember = async (projectId: string, userId: string): Promise<boolean> => {
  const res = await query(
    "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2",
    [projectId, userId]
  );
  return (res.rowCount || 0) > 0;
};

export const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
  const res = await query(
    `SELECT pm.*, u.name, u.email FROM project_members pm
     JOIN users u ON pm.user_id = u.id
     WHERE pm.project_id = $1
     ORDER BY pm.joined_at ASC`,
    [projectId]
  );
  return res.rows;
};

export const isProjectMember = async (projectId: string, userId: string): Promise<boolean> => {
  const res = await query(
    "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
    [projectId, userId]
  );
  return res.rows.length > 0;
};

export const isProjectOwner = async (projectId: string, userId: string): Promise<boolean> => {
  const res = await query(
    "SELECT 1 FROM projects WHERE id = $1 AND created_by = $2",
    [projectId, userId]
  );
  return res.rows.length > 0;
};
