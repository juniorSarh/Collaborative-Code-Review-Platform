import { Router } from 'express';
import { body, param } from 'express-validator';
import multer from 'multer';
import { SubmissionController } from '../controllers/submissionController';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate } from '../middlewares/auth';
import { SubmissionStatus } from '../models/Submission';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept code files and archives
    const allowedTypes = [
      'text/plain',
      'application/json',
      'application/javascript',
      'application/x-javascript',
      'text/x-python',
      'text/x-java',
      'text/x-c',
      'text/x-c++',
      'text/x-csharp',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-tar',
      'application/x-gzip',
      'application/gzip'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new submission with file upload
router.post(
  '/projects/:projectId/submissions',
  upload.single('file'),
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
    body('description').optional().trim(),
  ],
  validateRequest,
  SubmissionController.createSubmission
);

// Get all submissions for a project
router.get(
  '/projects/:projectId/submissions',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
  ],
  validateRequest,
  SubmissionController.getProjectSubmissions
);

// Get submission details
router.get(
  '/submissions/:submissionId',
  [
    param('submissionId').isUUID().withMessage('Invalid submission ID'),
  ],
  validateRequest,
  SubmissionController.getSubmission
);

// Update submission status
router.patch(
  '/submissions/:submissionId/status',
  [
    param('submissionId').isUUID().withMessage('Invalid submission ID'),
    body('status').isIn(Object.values(SubmissionStatus)).withMessage('Invalid status'),
  ],
  validateRequest,
  SubmissionController.updateSubmissionStatus
);

// Delete a submission
router.delete(
  '/submissions/:submissionId',
  [
    param('submissionId').isUUID().withMessage('Invalid submission ID'),
  ],
  validateRequest,
  SubmissionController.deleteSubmission
);

export default router;
