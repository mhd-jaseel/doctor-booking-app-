const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const hospitalController = require('../controllers/hospital.controller');
const doctorController = require('../controllers/doctor.controller');
const scheduleController = require('../controllers/schedule.controller');
const healthcareServiceController = require('../controllers/healthcareService.controller');
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validateObjectId } = require('../middleware/validateObjectId.middleware');
const { validateHospital, validateDoctor, validateSchedule } = require('../validations');
const { ROLES } = require('../constants');

// Apply strict authentication and Admin role guard on all /api/admin routes
router.use(protect);
router.use(restrictTo(ROLES.ADMIN));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Healthcare Services Management (Dynamic Category Management)
router.get('/healthcare-services', (req, res, next) => { req.query.isAdmin = true; next(); }, healthcareServiceController.getAllServices);
router.post('/healthcare-services', healthcareServiceController.createService);
router.put('/healthcare-services/:id', validateObjectId('id'), healthcareServiceController.updateService);
router.patch('/healthcare-services/:id', validateObjectId('id'), healthcareServiceController.updateService);
router.patch('/healthcare-services/:id/status', validateObjectId('id'), healthcareServiceController.toggleStatus);
router.delete('/healthcare-services/:id', validateObjectId('id'), healthcareServiceController.deleteService);

// Facility Management
router.get('/facilities', (req, res, next) => { req.query.isAdmin = true; next(); }, hospitalController.getHospitals);
router.post('/facilities', validateHospital, hospitalController.createHospital);
router.put('/facilities/:id', validateObjectId('id'), hospitalController.updateHospital);
router.patch('/facilities/:id/status', validateObjectId('id'), hospitalController.toggleHospitalStatus);
router.delete('/facilities/:id', validateObjectId('id'), hospitalController.deleteHospital);

// Doctor Management & Facility Assignments
router.get('/doctors', (req, res, next) => { req.query.isAdmin = true; next(); }, doctorController.getDoctors);
router.post('/doctors', validateDoctor, doctorController.createDoctor);
router.put('/doctors/:id', validateObjectId('id'), doctorController.updateDoctor);
router.patch('/doctors/:id/status', validateObjectId('id'), doctorController.toggleDoctorStatus);
router.delete('/doctors/:id', validateObjectId('id'), doctorController.deleteDoctor);
router.post('/doctors/:doctorId/facilities', validateObjectId('doctorId'), adminController.assignDoctorFacility);
router.delete('/doctors/:doctorId/facilities/:facilityId', validateObjectId('doctorId'), validateObjectId('facilityId'), adminController.removeDoctorFacility);

// Schedule Management
router.get('/schedules', adminController.getSchedules);
router.post('/schedules', validateSchedule, scheduleController.createSchedule);
router.put('/schedules/:id', validateObjectId('id'), scheduleController.updateSchedule);
router.patch('/schedules/:id/status', validateObjectId('id'), scheduleController.toggleScheduleAvailability);
router.delete('/schedules/:id', validateObjectId('id'), scheduleController.deleteSchedule);
router.get('/schedules/:scheduleId/waiting-list', validateObjectId('scheduleId'), adminController.getScheduleWaitingList);

// Appointment Management
router.get('/appointments', adminController.getAppointments);
router.get('/appointments/:id', validateObjectId('id'), adminController.getAppointmentById);
router.patch('/appointments/:id/cancel', validateObjectId('id'), adminController.cancelAppointment);

// User Management
router.get('/users', adminController.getUsers);
router.get('/users/:id', validateObjectId('id'), adminController.getUserDetails);
router.patch('/users/:id/status', validateObjectId('id'), adminController.toggleUserStatus);

// Ratings View
router.get('/ratings', adminController.getRatings);

module.exports = router;
