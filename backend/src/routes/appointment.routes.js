const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateObjectId } = require('../middleware/validateObjectId.middleware');
const { validateAppointment } = require('../validations');

router.use(protect); // All appointment routes require authentication

router.post('/', validateAppointment, appointmentController.bookAppointment);
router.get('/my', appointmentController.getMyAppointments);
router.get('/:id', validateObjectId('id'), appointmentController.getAppointmentById);
router.patch('/:id/cancel', validateObjectId('id'), appointmentController.cancelAppointment);

module.exports = router;
