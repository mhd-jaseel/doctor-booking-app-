const fileStorageService = require('../services/fileStorage.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

/**
 * Upload an image to MongoDB GridFS (Admin only)
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Please select an image file to upload.', 400);
  }

  const result = await fileStorageService.uploadFile(req.file, {
    uploadedBy: req.user?._id,
    type: req.body.type || 'general',
  });

  const host = req.get('host');
  const protocol = req.protocol;
  const imageUrl = `${protocol}://${host}/api/files/${result.fileId}`;

  return sendSuccess(res, 201, 'Image uploaded successfully to GridFS', {
    fileId: result.fileId,
    imageUrl,
    filename: result.filename,
    contentType: result.contentType,
    size: result.size,
  });
});

/**
 * Stream an image from MongoDB GridFS (Public access for guests and users)
 */
const getFileById = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const { stream, file } = await fileStorageService.getFileStream(fileId);

  // Cache-control header: allow client-side caching for 7 days
  res.set('Content-Type', file.contentType || 'image/jpeg');
  res.set('Cache-Control', 'public, max-age=604800');
  res.set('Content-Length', file.length);

  stream.pipe(res);
});

/**
 * Delete an image from MongoDB GridFS (Admin only)
 */
const deleteFileById = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const deleted = await fileStorageService.deleteFile(fileId);

  if (!deleted) {
    throw new AppError('File not found or already deleted', 404);
  }

  return sendSuccess(res, 200, 'Image deleted successfully from storage');
});

module.exports = {
  uploadImage,
  getFileById,
  deleteFileById,
};
