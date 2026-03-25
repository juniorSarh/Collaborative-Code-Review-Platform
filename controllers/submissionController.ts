import { Request, Response } from "express";
import * as submissionService from "../service/submissionService";

/**
 * Ensures the submissions table exists before performing operations.
 */
const ensureTableExists = async () => {
  try {
    await submissionService.createSubmissionsTable();
  } catch (error) {
    console.error("Submissions table initialization failed:", error);
    throw new Error("Internal database error during initialization");
  }
};

export const createSubmission = async (req: Request, res: Response) => {
  try {
    const { projectId, title, codeContent, fileName } = req.body;
    const userId = (req as any).user?.id;

    if (!projectId || !title || !codeContent) {
      return res.status(400).json({
        message: "Project ID, title, and code content are required",
      });
    }

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure table exists
    await ensureTableExists();

    // Check if user is a member of the project
    const isMember = await submissionService.isProjectMember(projectId, userId);
    if (!isMember) {
      return res.status(403).json({
        message: "You must be a project member to create submissions",
      });
    }

    const submission = await submissionService.createSubmission(
      projectId,
      userId,
      title,
      codeContent,
      fileName
    );

    res.status(201).json(submission);
  } catch (error) {
    console.error("Create submission error:", error);
    res.status(500).json({ message: "Error creating submission" });
  }
};

export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { projectId } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure table exists
    await ensureTableExists();

    let submissions;

    if (projectId) {
      // Get submissions for a specific project (project members only)
      const isMember = await submissionService.isProjectMember(
        projectId as string,
        userId
      );
      if (!isMember) {
        return res.status(403).json({
          message: "You must be a project member to view submissions",
        });
      }
      submissions = await submissionService.getSubmissionsByProject(
        projectId as string
      );
    } else {
      // Get user's own submissions
      submissions = await submissionService.getSubmissionsByUser(userId);
    }

    res.status(200).json(submissions);
  } catch (error) {
    console.error("Get submissions error:", error);
    res.status(500).json({ message: "Error fetching submissions" });
  }
};

export const getSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure table exists
    await ensureTableExists();

    const submission = await submissionService.getSubmissionById(id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Check if user is owner or project member
    const isOwner = await submissionService.isSubmissionOwner(id, userId);
    const isMember = await submissionService.isProjectMember(
      submission.project_id,
      userId
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(submission);
  } catch (error) {
    console.error("Get submission error:", error);
    res.status(500).json({ message: "Error fetching submission" });
  }
};

export const updateSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, codeContent, fileName, status } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure table exists
    await ensureTableExists();

    // Check if user is the submission owner
    const isOwner = await submissionService.isSubmissionOwner(id, userId);
    if (!isOwner) {
      return res.status(403).json({
        message: "Only submission owners can update submissions",
      });
    }

    const updatedSubmission = await submissionService.updateSubmission(id, {
      title,
      code_content: codeContent,
      file_name: fileName,
      status,
    });

    if (!updatedSubmission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.status(200).json(updatedSubmission);
  } catch (error) {
    console.error("Update submission error:", error);
    res.status(500).json({ message: "Error updating submission" });
  }
};

export const deleteSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure table exists
    await ensureTableExists();

    // Check if user is the submission owner
    const isOwner = await submissionService.isSubmissionOwner(id, userId);
    if (!isOwner) {
      return res.status(403).json({
        message: "Only submission owners can delete submissions",
      });
    }

    const deleted = await submissionService.deleteSubmission(id);
    if (!deleted) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.status(200).json({ message: "Submission deleted successfully" });
  } catch (error) {
    console.error("Delete submission error:", error);
    res.status(500).json({ message: "Error deleting submission" });
  }
};