const express = require("express");
const { 
  createProject, 
  getProjects, 
  getProject, 
  updateProject, 
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getProjectMembers
} = require("../controllers/projectController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create project
router.post("/", createProject);

// List projects for the authenticated user
router.get("/", getProjects);

// Get single project
router.get("/:id", getProject);

// Update project
router.put("/:id", updateProject);

// Delete project
router.delete("/:id", deleteProject);

// Add member to project
router.post("/:id/members", addProjectMember);

// Remove member from project
router.delete("/:id/members/:userId", removeProjectMember);

// Get project members
router.get("/:id/members", getProjectMembers);

module.exports = router;
