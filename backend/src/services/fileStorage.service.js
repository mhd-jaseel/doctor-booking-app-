const mongoose = require('mongoose');
const { Readable } = require('stream');
const AppError = require('../utils/AppError');

class FileStorageService {
  constructor() {
    this.bucket = null;
  }

  getBucket() {
    if (!this.bucket) {
      if (!mongoose.connection || mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
        throw new AppError('File storage is temporarily unavailable. Please try again.', 503);
      }
      // Use mongoose's bundled mongodb driver to guarantee BSON compatibility
      this.bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads',
      });
    }
    return this.bucket;
  }

  /**
   * Uploads a file buffer into MongoDB GridFS
   * @param {Object} file - Express multer file object
   * @param {Object} metadata - Optional metadata to store with file
   * @returns {Promise<Object>} Stored file document info
   */
  async uploadFile(file, metadata = {}) {
    if (!file || !file.buffer) {
      throw new AppError('No file data provided for upload.', 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new AppError('Image size must be 5 MB or less.', 413);
    }

    const bucket = this.getBucket();
    const safeOriginalName = (file.originalname || 'image.jpg')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}-${safeOriginalName}`;

    return new Promise((resolve, reject) => {
      let isSettled = false;

      const uploadStream = bucket.openUploadStream(filename, {
        contentType: file.mimetype || 'image/jpeg',
        metadata: {
          ...metadata,
          originalName: file.originalname || safeOriginalName,
          size: file.size,
          uploadedAt: new Date(),
        },
      });

      const readableStream = new Readable({
        read() {
          this.push(file.buffer);
          this.push(null);
        },
      });

      uploadStream.on('finish', () => {
        if (!isSettled) {
          isSettled = true;
          resolve({
            fileId: uploadStream.id.toString(),
            filename: filename,
            contentType: file.mimetype || 'image/jpeg',
            size: file.size,
          });
        }
      });

      uploadStream.on('error', (err) => {
        if (!isSettled) {
          isSettled = true;
          console.error('[GridFS Upload Error]:', err.message);
          reject(new AppError('Unable to upload image. Please try again.', 500));
        }
      });

      readableStream.on('error', (err) => {
        if (!isSettled) {
          isSettled = true;
          console.error('[ReadableStream Error]:', err.message);
          uploadStream.destroy();
          reject(new AppError('Unable to process image data. Please try again.', 500));
        }
      });

      readableStream.pipe(uploadStream);
    });
  }

  /**
   * Open download stream from GridFS by file ID
   * @param {string|ObjectId} fileId
   * @returns {Promise<{ stream: GridFSBucketReadStream, file: Object }>}
   */
  async getFileStream(fileId) {
    if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
      throw new AppError('Invalid file identifier format.', 400);
    }

    const bucket = this.getBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);

    const files = await bucket.find({ _id: objectId }).toArray();
    if (!files || files.length === 0) {
      throw new AppError('Image file not found.', 404);
    }

    const file = files[0];
    const stream = bucket.openDownloadStream(objectId);

    return { stream, file };
  }

  /**
   * Safely deletes a file from GridFS by ID
   * @param {string|ObjectId} fileId
   */
  async deleteFile(fileId) {
    if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
      return false;
    }

    try {
      const bucket = this.getBucket();
      const objectId = new mongoose.Types.ObjectId(fileId);
      const files = await bucket.find({ _id: objectId }).toArray();
      if (files && files.length > 0) {
        await bucket.delete(objectId);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`[FileStorageService] Error deleting file ${fileId}:`, err.message);
      return false;
    }
  }
}

module.exports = new FileStorageService();
