import { Request, Response } from "express";
import * as projectService from "../service/projectService";

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = (req as any).user?.id; // Will need to update auth integration
    
    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const project = await projectService.createProject(name, description, userId);
    res.status(201).json(project);
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ message: "Error creating project" });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const projects = await projectService.getProjectsByUser(userId);
    res.status(200).json(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ message: "Error fetching projects" });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const project = await projectService.getProjectById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is owner or member
    const isOwner = await projectService.isProjectOwner(id, userId);
    const isMember = await projectService.isProjectMember(id, userId);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ message: "Error fetching project" });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if user is owner
    const isOwner = await projectService.isProjectOwner(id, userId);
    if (!isOwner) {
      return res.status(403).json({ message: "Only project owners can update projects" });
    }

    const updatedProject = await projectService.updateProject(id, { name, description });
    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ message: "Error updating project" });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if user is owner
    const isOwner = await projectService.isProjectOwner(id, userId);
    if (!isOwner) {
      return res.status(403).json({ message: "Only project owners can delete projects" });
    }

    const deleted = await projectService.deleteProject(id);
    if (!deleted) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ message: "Error deleting project" });
  }
};

export const addProjectMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: memberUserId, role } = req.body;
    const currentUserId = (req as any).user?.id;
    
    if (!currentUserId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!memberUserId || !role) {
      return res.status(400).json({ message: "User ID and role are required" });
    }

    // Check if current user is owner
    const isOwner = await projectService.isProjectOwner(id, currentUserId);
    if (!isOwner) {
      return res.status(403).json({ message: "Only project owners can add members" });
    }

    const member = await projectService.addProjectMember(id, memberUserId, role);
    res.status(201).json(member);
  } catch (error) {
    console.error("Add project member error:", error);
    res.status(500).json({ message: "Error adding project member" });
  }
};

export const removeProjectMember = async (req: Request, res: Response) => {
  try {
    const { id, userId: memberUserId } = req.params;
    const currentUserId = (req as any).user?.id;
    
    if (!currentUserId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if current user is owner
    const isOwner = await projectService.isProjectOwner(id, currentUserId);
    if (!isOwner) {
      return res.status(403).json({ message: "Only project owners can remove members" });
    }

    const removed = await projectService.removeProjectMember(id, memberUserId);
    if (!removed) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove project member error:", error);
    res.status(500).json({ message: "Error removing project member" });
  }
};

export const getProjectMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if user is owner or member
    const isOwner = await projectService.isProjectOwner(id, userId);
    const isMember = await projectService.isProjectMember(id, userId);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const members = await projectService.getProjectMembers(id);
    res.status(200).json(members);
  } catch (error) {
    console.error("Get project members error:", error);
    res.status(500).json({ message: "Error fetching project members" });
  }
};
