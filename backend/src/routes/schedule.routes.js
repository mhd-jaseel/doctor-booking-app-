const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validateObjectId } = require('../middleware/validateObjectId.middleware');
const { validateSchedule } = require('../validations');
const { ROLES } = require('../constants');

router.get('/doctor/:doctorId', validateObjectId('doctorId'), scheduleController.getDoctorSchedules);
router.get('/:id', validateObjectId('id'), scheduleController.getScheduleById);

// Admin-only schedule management
router.post('/', protect, restrictTo(ROLES.ADMIN), validateSchedule, scheduleController.createSchedule);
router.put('/:id', protect, restrictTo(ROLES.ADMIN), validateObjectId('id'), scheduleController.updateSchedule);
router.patch('/:id/status', protect, restrictTo(ROLES.ADMIN), validateObjectId('id'), scheduleController.toggleScheduleAvailability);

module.exports = router;
