const multer = require('multer');
const AppError = require('../utils/AppError');

// In-memory storage so the image buffer can be streamed directly into MongoDB GridFS
const storage = multer.memoryStorage();

const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file format. Only JPEG, JPG, PNG, and WEBP image formats are supported.',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum limit
  },
});

module.exports = upload;
