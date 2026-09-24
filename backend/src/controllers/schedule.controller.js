const scheduleService = require('../services/schedule.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// Fetches all available schedules for a specific doctor.
const getDoctorSchedules = asyncHandler(async (req, res) => {
  const schedules = await scheduleService.getDoctorSchedules(req.params.doctorId);
  return sendSuccess(res, 200, 'Doctor schedules fetched', { schedules });
});

// Retrieves details for a specific schedule, including session configurations.
const getScheduleById = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.getScheduleById(req.params.id);
  return sendSuccess(res, 200, 'Schedule details fetched', { schedule });
});

// Creates a new consultation schedule for a doctor on a specific date.
const createSchedule = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.createSchedule(req.body);
  return sendSuccess(res, 201, 'Schedule created successfully', { schedule });
});

// Updates an existing schedule and validates for time conflicts.
const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.updateSchedule(req.params.id, req.body);
  return sendSuccess(res, 200, 'Schedule updated successfully', { schedule });
});

// Temporarily pauses or resumes token booking for a schedule.
const toggleScheduleAvailability = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.toggleScheduleAvailability(req.params.id);
  return sendSuccess(res, 200, 'Schedule availability toggled', { schedule });
});

// Deletes a schedule permanently if no appointments have been booked yet.
const deleteSchedule = asyncHandler(async (req, res) => {
  const result = await scheduleService.deleteSchedule(req.params.id);
  return sendSuccess(res, 200, 'Schedule deleted successfully', result);
});

module.exports = {
  getDoctorSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  toggleScheduleAvailability,
  deleteSchedule,
};
