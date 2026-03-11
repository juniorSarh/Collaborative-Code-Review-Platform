import { Router } from "express";
import * as commentController from "../controllers/commentController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create comment
router.post("/", commentController.createComment);

// Get comments for a submission
router.get("/submission/:submissionId", commentController.getComments);

// Update comment
router.put("/:id", commentController.updateComment);

// Delete comment
router.delete("/:id", commentController.deleteComment);

export default router;