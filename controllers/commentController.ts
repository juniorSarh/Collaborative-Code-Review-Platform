import { Request, Response } from "express";
import * as commentService from "../service/commentService";

/**
 * Ensures the comments table exists before performing operations.
 */
const ensureTableExists = async () => {
  try {
    await commentService.createCommentsTable();
  } catch (error) {
    console.error("Comments table initialization failed:", error);
    throw new Error("Internal database error during initialization");
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const { submissionId, content, lineNumber, parentCommentId } = req.body;
    const userId = (req as any).user?.id;
    
    if (!submissionId || !content) {
      return res.status(400).json({ 
        message: "Submission ID and content are required" 
      });
    }
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure table exists
    await ensureTableExists();

    // Check if user can access the submission
    const canAccess = await commentService.canAccessSubmission(submissionId, userId);
    if (!canAccess) {
      return res.status(403).json({ 
        message: "You don't have access to this submission" 
      });
    }

    const comment = await commentService.createComment(
      submissionId, 
      userId, 
      content, 
      lineNumber, 
      parentCommentId
    );
    
    res.status(201).json(comment);
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ message: "Error creating comment" });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { threaded } = req.query;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure table exists
    await ensureTableExists();

    // Check if user can access the submission
    const canAccess = await commentService.canAccessSubmission(submissionId, userId);
    if (!canAccess) {
      return res.status(403).json({ 
        message: "You don't have access to this submission" 
      });
    }

    let comments;
    
    if (threaded === 'true') {
      comments = await commentService.getThreadedComments(submissionId);
    } else {
      comments = await commentService.getCommentsBySubmission(submissionId);
    }
    
    res.status(200).json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Error fetching comments" });
  }
};

export const updateComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = (req as any).user?.id;
    
    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure table exists
    await ensureTableExists();

    // Check if user is the comment owner
    const isOwner = await commentService.isCommentOwner(id, userId);
    if (!isOwner) {
      return res.status(403).json({ 
        message: "Only comment owners can update comments" 
      });
    }

    const updatedComment = await commentService.updateComment(id, content);
    
    if (!updatedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json(updatedComment);
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({ message: "Error updating comment" });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure table exists
    await ensureTableExists();

    // Check if user is the comment owner
    const isOwner = await commentService.isCommentOwner(id, userId);
    if (!isOwner) {
      return res.status(403).json({ 
        message: "Only comment owners can delete comments" 
      });
    }

    const deleted = await commentService.deleteComment(id);
    if (!deleted) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Error deleting comment" });
  }
};