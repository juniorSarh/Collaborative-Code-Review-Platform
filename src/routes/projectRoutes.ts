import { Router } from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  deleteProject,
  updateProject,
} from "../controllers/projectControllers";
const router = Router();
router.post("/", createProject);
router.get("/", getAllProjects);
router.get("/:id", getProjectById);
router.delete("/:id", deleteProject);
router.put("/:id", updateProject);
export default router;
