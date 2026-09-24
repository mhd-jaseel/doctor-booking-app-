const appointmentService = require('../services/appointment.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// Books the selected token for a patient.
const bookAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.bookAppointment(req.user._id, req.body);
  return sendSuccess(res, 201, 'Appointment booked successfully', { appointment });
});

// Retrieves a paginated list of the user's past and upcoming appointments.
const getMyAppointments = asyncHandler(async (req, res) => {
  const result = await appointmentService.getMyAppointments(req.user._id, req.query);
  return sendSuccess(res, 200, 'Appointments fetched successfully', { appointments: result.appointments }, result.pagination);
});

// Fetches detailed information for a specific appointment.
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.getAppointmentById(req.params.id, req.user._id);
  return sendSuccess(res, 200, 'Appointment fetched successfully', { appointment });
});

// Cancels an existing appointment and reorders the token queue if applicable.
const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.cancelAppointment(req.params.id, req.user._id);
  return sendSuccess(res, 200, 'Appointment cancelled successfully', { appointment });
});

module.exports = {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
};
