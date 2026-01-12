import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
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

      // Generate URL for the uploaded file
      const baseUrl = req.protocol + '://' + req.get('host');
      const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

      sendSuccess(res, {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      }, 'Image uploaded successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
export default uploadController;
