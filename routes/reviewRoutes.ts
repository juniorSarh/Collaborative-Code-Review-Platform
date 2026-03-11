import { Router } from "express";
import * as reviewController from "../controllers/reviewController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create review (requires reviewer role)
router.post("/", authorize(['admin', 'reviewer']), reviewController.createReview);

// Get reviews for a submission
router.get("/submission/:submissionId", reviewController.getReviews);

// Update review
router.put("/:id", reviewController.updateReview);

// Delete review
router.delete("/:id", reviewController.deleteReview);

export default router;
