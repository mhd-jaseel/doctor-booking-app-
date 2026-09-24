const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const upload = require('../middleware/upload.middleware');
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { ROLES } = require('../constants');

// Public access to stream images (Guests & Users)
router.get('/:fileId', fileController.getFileById);

// Admin-only upload & delete endpoints
router.post(
  '/upload',
  protect,
  restrictTo(ROLES.ADMIN),
  upload.single('image'),
  fileController.uploadImage
);

router.delete(
  '/:fileId',
  protect,
  restrictTo(ROLES.ADMIN),
  fileController.deleteFileById
);

module.exports = router;
