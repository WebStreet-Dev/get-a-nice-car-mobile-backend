import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import cloudinaryService from '../services/cloudinary.service.js';
import { logger } from '../utils/logger.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const ensureUploadsDirectory = () => {
  const uploadPath = path.join(__dirname, '../../uploads');
  try {
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true, mode: 0o755 });
    }
  } catch (error) {
    console.error('Error creating uploads directory:', error);
    throw error;
  }
  return uploadPath;
};

// Initialize uploads directory
const uploadsPath = ensureUploadsDirectory();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before saving
    ensureUploadsDirectory();
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter - only allow images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  // Check MIME type first
  const hasValidMimeType = allowedMimes.includes(file.mimetype);
  
  // Also check file extension as fallback (for cases where MIME type might be incorrect)
  const fileExt = path.extname(file.originalname).toLowerCase();
  const hasValidExtension = allowedExtensions.includes(fileExt);
  
  // Accept if either MIME type or extension is valid
  if (hasValidMimeType || hasValidExtension) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed. Received: ${file.mimetype}, extension: ${fileExt}`));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

export class UploadController {
  /**
   * Upload image
   * POST /api/v1/upload/image
   */
  async uploadImage(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'No file uploaded', 400);
        return;
      }

      // Verify file was actually saved
      const filePath = path.join(uploadsPath, req.file.filename);
      if (!fs.existsSync(filePath)) {
        sendError(res, 'File was not saved successfully', 500);
        return;
      }

      let fileUrl: string;
      let shouldDeleteLocalFile = false;

      // Try to upload to Cloudinary first (if configured)
      if (cloudinaryService.isConfigured()) {
        logger.info('Attempting to upload to Cloudinary...');
        const cloudinaryUrl = await cloudinaryService.uploadImage(filePath, req.file.originalname);
        
        if (cloudinaryUrl) {
          // Successfully uploaded to Cloudinary
          fileUrl = cloudinaryUrl;
          shouldDeleteLocalFile = true; // Clean up local file after cloud upload
          logger.info('Image uploaded to Cloudinary successfully', { url: cloudinaryUrl });
        } else {
          // Cloudinary upload failed, fall back to local storage
          logger.warn('Cloudinary upload failed, falling back to local storage');
          const baseUrl = req.protocol + '://' + req.get('host');
          fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
        }
      } else {
        // Cloudinary not configured, use local storage
        const baseUrl = req.protocol + '://' + req.get('host');
        fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      }

      // Clean up local file if uploaded to Cloudinary
      if (shouldDeleteLocalFile) {
        try {
          fs.unlinkSync(filePath);
          logger.info('Local file deleted after Cloudinary upload', { filename: req.file.filename });
        } catch (deleteError) {
          logger.warn('Failed to delete local file after Cloudinary upload', deleteError as object);
          // Don't fail the request if cleanup fails
        }
      }

      sendSuccess(res, {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        storage: cloudinaryService.isConfigured() && shouldDeleteLocalFile ? 'cloudinary' : 'local',
      }, 'Image uploaded successfully');
    } catch (error) {
      logger.error('Upload error:', error as object);
      next(error);
    }
  }
}

export const uploadController = new UploadController();
export default uploadController;
