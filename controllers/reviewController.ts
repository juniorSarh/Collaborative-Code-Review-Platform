import { Request, Response } from "express";
import * as reviewService from "../service/reviewService";

/**
 * Ensures the reviews table exists before performing operations.
 */
const ensureTableExists = async () => {
  try {
    await reviewService.createReviewsTable();
  } catch (error) {
    console.error("Reviews table initialization failed:", error);
    throw new Error("Internal database error during initialization");
  }
};

export const createReview = async (req: Request, res: Response) => {
  try {
    const { submissionId, decision, feedback } = req.body;
    const userId = (req as any).user?.id;
    
    if (!submissionId || !decision) {
      return res.status(400).json({ 
        message: "Submission ID and decision are required" 
      });
    }
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure table exists
    await ensureTableExists();

    // Check if user can review the submission
    const canReview = await reviewService.canReviewSubmission(submissionId, userId);
    if (!canReview) {
      return res.status(403).json({ 
        message: "You don't have permission to review this submission" 
      });
    }

    const review = await reviewService.createReview(
      submissionId, 
      userId, 
      decision, 
      feedback
    );
    
    // Update submission status based on reviews
    await reviewService.updateSubmissionStatusFromReviews(submissionId);
    
    res.status(201).json(review);
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ message: "Error creating review" });
  }
};

export const getReviews = async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure table exists
    await ensureTableExists();

    // Check if user can access the submission
    const canAccess = await reviewService.canReviewSubmission(submissionId, userId);
    if (!canAccess) {
      // Also check if they can just view (not review)
      const commentService = require("../service/commentService");
      const canView = await commentService.canAccessSubmission(submissionId, userId);
      if (!canView) {
        return res.status(403).json({ 
          message: "You don't have access to this submission" 
        });
      }
    }

    const reviews = await reviewService.getReviewsBySubmission(submissionId);
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ message: "Error fetching reviews" });
  }
};

export const updateReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, feedback } = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure table exists
    await ensureTableExists();

    // Check if user is the review owner
    const isOwner = await reviewService.isReviewOwner(id, userId);
    if (!isOwner) {
      return res.status(403).json({ 
        message: "Only review owners can update reviews" 
      });
    }

    const updatedReview = await reviewService.updateReview(id, decision, feedback);
    
    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Update submission status based on reviews
    await reviewService.updateSubmissionStatusFromReviews(updatedReview.submission_id);

    res.status(200).json(updatedReview);
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ message: "Error updating review" });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure table exists
    await ensureTableExists();

    // Check if user is the review owner
    const isOwner = await reviewService.isReviewOwner(id, userId);
    if (!isOwner) {
      return res.status(403).json({ 
        message: "Only review owners can delete reviews" 
      });
    }

    // Get the review before deleting to update submission status
    const review = await reviewService.getReviewById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const deleted = await reviewService.deleteReview(id);
    if (!deleted) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Update submission status based on remaining reviews
    await reviewService.updateSubmissionStatusFromReviews(review.submission_id);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ message: "Error deleting review" });
  }
};