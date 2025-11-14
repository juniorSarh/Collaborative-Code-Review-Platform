import pool from '../config/database';
import { UserRole } from './User';

export interface ProjectMember {
  user_id: string;
  role: UserRole;
  joined_at: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  members: ProjectMember[];
}

export class ProjectModel {
  static async create(
    name: string,
    createdBy: string,
    description: string | null = null
  ): Promise<Project> {
    const query = `
      WITH new_project AS (
        INSERT INTO projects (name, description, created_by)
        VALUES ($1, $2, $3)
        RETURNING *
      )
      SELECT 
        p.*,
        json_build_array(
          json_build_object(
            'user_id', $3::text,
            'role', 'admin'::text,
            'joined_at', p.created_at
          )
        ) as members
      FROM new_project p
    `;
    
    const { rows } = await pool.query(query, [name, description, createdBy]);
    return this.mapProject(rows[0]);
  }

  static async findById(id: string): Promise<Project | null> {
    const query = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'user_id', pm.user_id::text,
              'role', pm.role,
              'joined_at', pm.joined_at
            )
          ) FILTER (WHERE pm.user_id IS NOT NULL),
          '[]'::json
        ) as members
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    
    const { rows } = await pool.query(query, [id]);
    return rows.length ? this.mapProject(rows[0]) : null;
  }

  static async findByUser(userId: string): Promise<Project[]> {
    const query = `
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'user_id', pm.user_id::text,
            'role', pm.role,
            'joined_at', pm.joined_at
          )
        ) as members
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = $1
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `;
    
    const { rows } = await pool.query(query, [userId]);
    return rows.map(this.mapProject);
  }

  static async update(
    id: string,
    updates: { name?: string; description?: string | null }
  ): Promise<Project | null> {
    const { name, description } = updates;
    const query = `
      UPDATE projects
      SET 
        name = COALESCE($1, name),
        description = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [name, description, id]);
    return rows.length ? this.findById(rows[0].id) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM projects WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  static async addMember(
    projectId: string,
    userId: string,
    role: UserRole = UserRole.SUBMITTER
  ): Promise<boolean> {
    const query = `
      INSERT INTO project_members (project_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (project_id, user_id) DO UPDATE
      SET role = EXCLUDED.role
      RETURNING *
    `;
    
    const result = await pool.query(query, [projectId, userId, role]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  static async removeMember(projectId: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2';
    const result = await pool.query(query, [projectId, userId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  private static mapProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      members: row.members || []
    };
  }
}
