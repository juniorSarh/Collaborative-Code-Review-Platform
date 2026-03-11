import { Router } from "express";
import * as submissionController from "../controllers/submissionController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create submission
router.post("/", submissionController.createSubmission);

// List submissions (user's own or by project)
router.get("/", submissionController.getSubmissions);

// Get single submission
router.get("/:id", submissionController.getSubmission);

// Update submission
router.put("/:id", submissionController.updateSubmission);

// Delete submission
router.delete("/:id", submissionController.deleteSubmission);

export default router;
