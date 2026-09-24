const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospital.controller');
const doctorController = require('../controllers/doctor.controller');
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validateObjectId } = require('../middleware/validateObjectId.middleware');
const { validateHospital } = require('../validations');
const { ROLES } = require('../constants');

router.get('/', hospitalController.getHospitals);
router.get('/:id', validateObjectId('id'), hospitalController.getHospitalById);
router.get('/:hospitalId/doctors', validateObjectId('hospitalId'), doctorController.getDoctorsByHospital);

// Admin-only operations
router.post('/', protect, restrictTo(ROLES.ADMIN), validateHospital, hospitalController.createHospital);
router.put('/:id', protect, restrictTo(ROLES.ADMIN), validateObjectId('id'), hospitalController.updateHospital);
router.patch('/:id/status', protect, restrictTo(ROLES.ADMIN), validateObjectId('id'), hospitalController.toggleHospitalStatus);

module.exports = router;
