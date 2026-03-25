import { Router } from "express";
import {
  createSubmission,
  getAllSubmissions,
  getSubmissionById,
  deleteSubmission,
  updateSubmission,
} from "../controllers/submitControllers";
const router = Router();
router.post("/", createSubmission);
router.get("/", getAllSubmissions);
router.get("/:id", getSubmissionById);
router.delete("/:id", deleteSubmission);
router.put("/:id", updateSubmission);
export default router;
