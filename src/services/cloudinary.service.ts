import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

// Configure Cloudinary if credentials are provided
const isCloudinaryConfigured = 
  config.cloudinary.cloudName && 
  config.cloudinary.apiKey && 
  config.cloudinary.apiSecret;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true, // Use HTTPS
  });
  logger.info('Cloudinary configured successfully');
} else {
  logger.warn('Cloudinary not configured - using local file storage');
}

export class CloudinaryService {
  /**
   * Upload image to Cloudinary
   * @param filePath - Path to the local file
   * @param originalName - Original filename
   * @returns Cloudinary URL or null if upload fails
   */
  async uploadImage(filePath: string, originalName: string): Promise<string | null> {
    if (!isCloudinaryConfigured) {
      return null;
    }

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: config.cloudinary.folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' }, // Optimize quality automatically
          { fetch_format: 'auto' }, // Auto format (WebP when supported)
        ],
        overwrite: false,
        unique_filename: true,
      });

      logger.info('Image uploaded to Cloudinary', {
        publicId: result.public_id,
        url: result.secure_url,
      });

      return result.secure_url;
    } catch (error) {
      logger.error('Cloudinary upload error:', error as object);
      return null;
    }
  }

  /**
   * Upload image from buffer (for direct uploads)
   * @param buffer - Image buffer
   * @param originalName - Original filename
   * @returns Cloudinary URL or null if upload fails
   */
  async uploadImageFromBuffer(buffer: Buffer, originalName: string): Promise<string | null> {
    if (!isCloudinaryConfigured) {
      return null;
    }

    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: config.cloudinary.folder,
          resource_type: 'image',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
          overwrite: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload from buffer error:', error);
            resolve(null);
            return;
          }

          if (result) {
            logger.info('Image uploaded to Cloudinary from buffer', {
              publicId: result.public_id,
              url: result.secure_url,
            });
            resolve(result.secure_url);
          } else {
            resolve(null);
          }
        }
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  /**
   * Delete image from Cloudinary
   * @param imageUrl - Full Cloudinary URL or public ID
   * @returns true if deleted successfully
   */
  async deleteImage(imageUrl: string): Promise<boolean> {
    if (!isCloudinaryConfigured) {
      return false;
    }

    try {
      // Extract public ID from URL
      const publicId = this.extractPublicId(imageUrl);
      if (!publicId) {
        logger.warn('Could not extract public ID from URL:', { url: imageUrl });
        return false;
      }

      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        logger.info('Image deleted from Cloudinary', { publicId });
        return true;
      } else {
        logger.warn('Cloudinary delete result:', result.result);
        return false;
      }
    } catch (error) {
      logger.error('Cloudinary delete error:', error as object);
      return false;
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   * Example: https://res.cloudinary.com/cloudname/image/upload/v1234567890/folder/image.jpg
   * Returns: folder/image
   */
  private extractPublicId(url: string): string | null {
    try {
      // If it's already a public ID (no http), return as is
      if (!url.startsWith('http')) {
        return url;
      }

      // Extract from URL
      const urlParts = url.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex === -1) {
        return null;
      }

      // Get everything after 'upload' and before the file extension
      const pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
      const publicId = pathAfterUpload.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
      
      return publicId;
    } catch (error) {
      logger.error('Error extracting public ID:', error as object);
      return null;
    }
  }

  /**
   * Check if Cloudinary is configured
   */
  isConfigured(): boolean {
    return Boolean(isCloudinaryConfigured);
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
