import { Request, Response } from 'express';
import { SubmissionModel, Submission, SubmissionStatus } from '../models/Submission';
import { ProjectModel } from '../models/Project';
import { UserRole } from '../models/User';
import { ApiError } from '../middlewares/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

export class SubmissionController {
  // Create a new submission
  static async createSubmission(req: Request, res: Response) {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { projectId } = req.params;
    const userId = req.user?.id?.toString();
    const { title, description } = req.body;
    const file = req.file as Express.Multer.File | undefined;

    // Check if project exists and user is a member
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const isMember = project.members.some(member => member.user_id === userId);
    if (!isMember) {
      throw new ApiError(403, 'You are not a member of this project');
    }

    let fileInfo = null;
    if (file) {
      const uploadDir = path.join(__dirname, '../../uploads/submissions');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileExt = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);

      // Move file to uploads directory
      await fs.promises.rename(file.path, filePath);

      fileInfo = {
        path: `/uploads/submissions/${fileName}`,
        name: file.originalname,
        type: file.mimetype
      };
    }

    const submission = await SubmissionModel.create(
      projectId,
      userId,
      title,
      description,
      fileInfo
    );

    res.status(201).json({
      success: true,
      data: submission
    });
  }

  // Get all submissions for a project
  static async getProjectSubmissions(req: Request, res: Response) {
    const { projectId } = req.params;

    // Check if project exists and user is a member
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const userId = req.user?.id?.toString();
    const isMember = project.members.some(member => member.user_id === userId);
    if (!isMember) {
      throw new ApiError(403, 'You are not a member of this project');
    }

    const submissions = await SubmissionModel.findByProject(projectId);
    
    res.json({
      success: true,
      data: submissions
    });
  }

  // Update submission status
  static async updateSubmissionStatus(req: Request, res: Response) {
    const { submissionId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id?.toString();

    if (!Object.values(SubmissionStatus).includes(status)) {
      throw new ApiError(400, 'Invalid status');
    }

    // Check if user is a reviewer or admin in the project
    const submission = await SubmissionModel.findById(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    const project = await ProjectModel.findById(submission.project_id);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const userRole = project.members.find(member => member.user_id === userId)?.role;
    if (userRole !== 'admin' && userRole !== 'reviewer') {
      throw new ApiError(403, 'Only reviewers and admins can update submission status');
    }

    if (!userId) {
      throw new ApiError(401, 'User ID is required');
    }

    const updatedSubmission = await SubmissionModel.updateStatus(
      submissionId,
      status as SubmissionStatus,
      userId
    );

    res.json({
      success: true,
      data: updatedSubmission
    });
  }

  // Delete a submission
  static async deleteSubmission(req: Request, res: Response) {
    const { submissionId } = req.params;

    // Check if submission exists and user is the owner
    const submission = await SubmissionModel.findById(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    if (submission.user_id !== req.user?.id) {
      throw new ApiError(403, 'You can only delete your own submissions');
    }

    // Delete file if exists
    if (submission.file_path) {
      const filePath = path.join(__dirname, '../..', submission.file_path);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    }

    await SubmissionModel.delete(submissionId, req.user.id);

    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });
  }

  // Get submission details
  static async getSubmission(req: Request, res: Response) {
    const { submissionId } = req.params;

    const submission = await SubmissionModel.findById(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    // Check if user is a member of the project
    const project = await ProjectModel.findById(submission.project_id);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const isMember = project.members.some(member => member.user_id === req.user?.id);
    if (!isMember) {
      throw new ApiError(403, 'You are not a member of this project');
    }

    res.json({
      success: true,
      data: submission
    });
  }
}
