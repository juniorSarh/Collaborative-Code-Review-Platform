import { Router } from 'express';
import { body, param } from 'express-validator';
import { ProjectController } from '../controllers/projectController';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate } from '../middlewares/auth';
import { UserRole } from '../models/User';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new project
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1 }).withMessage('Project name is required'),
    body('description').optional().trim(),
  ],
  validateRequest,
  ProjectController.createProject
);

// Get all projects for the current user
router.get('/', ProjectController.getUserProjects);

// Get project by ID
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid project ID'),
  ],
  validateRequest,
  ProjectController.getProject
);

// Update project
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid project ID'),
    body('name').optional().trim().isLength({ min: 1 }),
    body('description').optional().trim(),
  ],
  validateRequest,
  ProjectController.updateProject
);

// Delete project
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid project ID'),
  ],
  validateRequest,
  ProjectController.deleteProject
);

// Add member to project
router.post(
  '/:id/members',
  [
    param('id').isUUID().withMessage('Invalid project ID'),
    body('userId').isUUID().withMessage('Invalid user ID'),
    body('role').isIn(Object.values(UserRole)).withMessage('Invalid role'),
  ],
  validateRequest,
  ProjectController.addProjectMember
);

// Remove member from project
router.delete(
  '/:id/members/:userId',
  [
    param('id').isUUID().withMessage('Invalid project ID'),
    param('userId').isUUID().withMessage('Invalid user ID'),
  ],
  validateRequest,
  ProjectController.removeProjectMember
);

export default router;
