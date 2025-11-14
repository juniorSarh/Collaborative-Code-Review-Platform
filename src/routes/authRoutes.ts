import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('name').optional().trim().isString(),
    body('role').optional().isIn(['reviewer', 'submitter']),
  ],
  validateRequest,
  AuthController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  validateRequest,
  AuthController.login
);

// Get current user profile
router.get('/profile', authenticate, AuthController.getProfile);

// Update profile
router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().isString(),
    body('avatarUrl').optional().isURL().withMessage('Please provide a valid URL'),
  ],
  validateRequest,
  AuthController.updateProfile
);

// Change password
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').exists().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
  ],
  validateRequest,
  AuthController.changePassword
);

// Logout
router.post('/logout', authenticate, AuthController.logout);

export default router;
