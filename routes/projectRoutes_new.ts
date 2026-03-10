import { Router } from "express";
import * as projectController from "../controllers/projectController_new";
import { authenticate, authorize } from "../middleware/auth_updated";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create project
router.post("/", authorize(['admin', 'reviewer']), projectController.createProject);

// List projects for the authenticated user
router.get("/", projectController.getProjects);

// Get single project
router.get("/:id", projectController.getProject);

// Update project
router.put("/:id", authorize(['admin', 'reviewer']), projectController.updateProject);

// Delete project
router.delete("/:id", authorize(['admin', 'reviewer']), projectController.deleteProject);

// Add member to project
router.post("/:id/members", authorize(['admin', 'reviewer']), projectController.addProjectMember);

// Remove member from project
router.delete("/:id/members/:userId", authorize(['admin', 'reviewer']), projectController.removeProjectMember);

// Get project members
router.get("/:id/members", projectController.getProjectMembers);

export default router;
