import { Request, Response } from 'express';
import { ProjectModel, Project, ProjectMember } from '../models/Project';
import { UserRole } from '../models/User';
import { ApiError } from '../middlewares/errorHandler';

export class ProjectController {
  // Create a new project
  static async createProject(req: Request, res: Response) {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { name, description } = req.body;
    const userId = req.user?.id?.toString();
    
    if (!userId) {
      throw new ApiError(401, 'User ID is required');
    }
    
    const project = await ProjectModel.create(name, userId, description);
    
    res.status(201).json({
      success: true,
      data: project,
    });
  }

  // Get projects for the authenticated user
  static async getUserProjects(req: Request, res: Response) {
    const userId = req.user?.id?.toString();
    
    if (!userId) {
      throw new ApiError(401, 'User ID is required');
    }
    
    const projects = await ProjectModel.findByUser(userId);
    
    res.json({
      success: true,
      data: projects,
    });
  }

  // Get project by ID
  static async getProject(req: Request, res: Response) {
    const { id } = req.params;
    const project = await ProjectModel.findById(id);
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Check if user is a member of the project
    const currentUserId = req.user?.id?.toString();
    const isMember = project.members.some(member => member.user_id.toString() === currentUserId);
    if (!isMember) {
      throw new ApiError(403, 'Not authorized to access this project');
    }
    
    res.json({
      success: true,
      data: project,
    });
  }

  // Update project
  static async updateProject(req: Request, res: Response) {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Check if user is the project owner or admin
    const project = await ProjectModel.findById(id);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const currentUserId = req.user?.id?.toString();
    const isOwner = project.created_by === currentUserId;
    if (!isOwner) {
      throw new ApiError(403, 'Only the project owner can update the project');
    }

    const updatedProject = await ProjectModel.update(id, { name, description });
    
    res.json({
      success: true,
      data: updatedProject,
    });
  }

  // Delete project
  static async deleteProject(req: Request, res: Response) {
    const { id } = req.params;
    
    // Check if user is the project owner
    const project = await ProjectModel.findById(id);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const currentUserId = req.user?.id?.toString();
    const isOwner = project.created_by.toString() === currentUserId;
    if (!isOwner) {
      throw new ApiError(403, 'Only the project owner can delete the project');
    }

    await ProjectModel.delete(id);
    
    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  }

  // Add member to project
  static async addProjectMember(req: Request, res: Response) {
    const { id: projectId } = req.params;
    const { userId: newMemberId, role } = req.body;

    // Check if user has permission to add members (owner or admin)
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const currentUserId = req.user?.id?.toString();
    const isAdmin = project.members.some(
      member => member.user_id === currentUserId && 
      (member.role === UserRole.ADMIN || member.role === UserRole.OWNER)
    );
    
    if (!isAdmin) {
      throw new ApiError(403, 'Only admins can add members to the project');
    }

    await ProjectModel.addMember(projectId, newMemberId, role);
    const updatedProject = await ProjectModel.findById(projectId);
    
    res.json({
      success: true,
      data: updatedProject,
    });
  }

  // Remove member from project
  static async removeProjectMember(req: Request, res: Response) {
    const { id: projectId, userId } = req.params;

    // Check if user has permission to remove members (owner or admin)
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const currentUserId = req.user?.id?.toString();
    const isAdmin = project.members.some(
      member => member.user_id === currentUserId && 
      (member.role === UserRole.ADMIN || member.role === UserRole.OWNER)
    );
    
    if (!isAdmin) {
      throw new ApiError(403, 'Only admins can remove members from the project');
    }

    // Prevent removing the project owner
    const memberToRemove = project.members.find(member => member.user_id === userId);
    if (memberToRemove?.role === UserRole.OWNER) {
      throw new ApiError(400, 'Cannot remove the project owner');
    }

    await ProjectModel.removeMember(projectId, userId);
    const updatedProject = await ProjectModel.findById(projectId);
    
    res.json({
      success: true,
      data: updatedProject,
    });
  }
}
