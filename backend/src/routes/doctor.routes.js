const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const scheduleController = require('../controllers/schedule.controller');
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validateObjectId } = require('../middleware/validateObjectId.middleware');
const { validateDoctor } = require('../validations');
const { ROLES } = require('../constants');

router.get('/', doctorController.getDoctors);
router.get('/hospital/:hospitalId', validateObjectId('hospitalId'), doctorController.getDoctorsByHospital);
router.get('/:id', validateObjectId('id'), doctorController.getDoctorById);
router.get('/:doctorId/schedules', validateObjectId('doctorId'), scheduleController.getDoctorSchedules);

// Admin-only operations
router.post('/', protect, restrictTo(ROLES.ADMIN), validateDoctor, doctorController.createDoctor);
router.put('/:id', protect, restrictTo(ROLES.ADMIN), validateObjectId('id'), doctorController.updateDoctor);
router.patch('/:id/status', protect, restrictTo(ROLES.ADMIN), validateObjectId('id'), doctorController.toggleDoctorStatus);

module.exports = router;
