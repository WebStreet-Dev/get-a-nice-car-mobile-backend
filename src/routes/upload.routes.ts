import { Router } from 'express';
import uploadController, { upload } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * @route   POST /api/v1/upload/image
 * @desc    Upload an image file
 * @access  Private (Admin only)
 */
router.post(
  '/image',
  authenticate,
  upload.single('image'),
  uploadController.uploadImage.bind(uploadController)
);

export default router;
