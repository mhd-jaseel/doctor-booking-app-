const adminService = require('../services/admin.service');
const appointmentService = require('../services/appointment.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const getDashboard = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  return sendSuccess(res, 200, 'Admin dashboard stats fetched', stats);
});

const getUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getAllUsers(req.query);
  return sendSuccess(res, 200, 'Users fetched successfully', { users: result.users }, result.pagination);
});

const getUserDetails = asyncHandler(async (req, res) => {
  const result = await adminService.getUserDetails(req.params.id);
  return sendSuccess(res, 200, 'User details fetched successfully', result);
});

const toggleUserStatus = asyncHandler(async (req, res) => {
  const result = await adminService.toggleUserStatus(req.params.id);
  return sendSuccess(res, 200, 'User status toggled successfully', { user: result });
});

const getAppointments = asyncHandler(async (req, res) => {
  const result = await adminService.getAllAppointments(req.query);
  return sendSuccess(res, 200, 'Appointments fetched successfully', { appointments: result.appointments }, result.pagination);
});

const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await adminService.getAppointmentById(req.params.id);
  return sendSuccess(res, 200, 'Appointment details fetched', { appointment });
});

const cancelAppointment = asyncHandler(async (req, res) => {
  // Uses core business logic: frees token, promotes waiting list #1, creates notification
  const result = await appointmentService.cancelAppointment(req.params.id, req.user._id, true);
  return sendSuccess(res, 200, 'Appointment cancelled successfully by admin', result);
});

const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appointment = await adminService.updateAppointmentStatus(req.params.id, req.body.status);
  return sendSuccess(res, 200, 'Appointment status updated successfully', { appointment });
});

const getSchedules = asyncHandler(async (req, res) => {
  const result = await adminService.getAllSchedules(req.query);
  return sendSuccess(res, 200, 'Schedules fetched successfully', { schedules: result.schedules }, result.pagination);
});

const getScheduleWaitingList = asyncHandler(async (req, res) => {
  const result = await adminService.getScheduleWaitingList(req.params.scheduleId, req.query);
  return sendSuccess(res, 200, 'Waiting list fetched successfully', { waitingList: result.waitingList }, result.pagination);
});

const assignDoctorFacility = asyncHandler(async (req, res) => {
  const doctor = await adminService.assignDoctorFacility(req.params.doctorId, req.body.facilityId);
  return sendSuccess(res, 200, 'Doctor assigned to facility successfully', { doctor });
});

const removeDoctorFacility = asyncHandler(async (req, res) => {
  const doctor = await adminService.removeDoctorFacility(req.params.doctorId, req.params.facilityId);
  return sendSuccess(res, 200, 'Doctor removed from facility successfully', { doctor });
});

const getRatings = asyncHandler(async (req, res) => {
  const result = await adminService.getRatingsSummary(req.query);
  return sendSuccess(res, 200, 'Rating statistics fetched successfully', {
    doctorRatings: result.doctorRatings,
    hospitalRatings: result.hospitalRatings,
    recentRatings: result.recentRatings,
  }, result.pagination);
});

module.exports = {
  getDashboard,
  getUsers,
  getUserDetails,
  toggleUserStatus,
  getAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointmentStatus,
  getSchedules,
  getScheduleWaitingList,
  assignDoctorFacility,
  removeDoctorFacility,
  getRatings,
};
