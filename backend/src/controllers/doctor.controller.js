const doctorService = require('../services/doctor.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// Fetches a paginated list of all active doctors for users, or all doctors for admins.
const getDoctors = asyncHandler(async (req, res) => {
  const result = await doctorService.getAllDoctors(req.query);
  return sendSuccess(res, 200, 'Doctors fetched successfully', { doctors: result.doctors }, result.pagination);
});

// Retrieves public profile details for a specific doctor.
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await doctorService.getDoctorById(req.params.id);
  return sendSuccess(res, 200, 'Doctor details fetched successfully', { doctor });
});

// Fetches doctors assigned to a specific hospital or facility.
const getDoctorsByHospital = asyncHandler(async (req, res) => {
  const result = await doctorService.getDoctorsByHospital(req.params.hospitalId, req.query);
  return sendSuccess(res, 200, 'Doctors for hospital fetched', { doctors: result.doctors }, result.pagination);
});

// Creates a new doctor profile from the Admin panel.
const createDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorService.createDoctor(req.body);
  return sendSuccess(res, 201, 'Doctor created successfully', { doctor });
});

// Updates an existing doctor profile from the Admin panel.
const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorService.updateDoctor(req.params.id, req.body);
  return sendSuccess(res, 200, 'Doctor updated successfully', { doctor });
});

// Activates or deactivates a doctor so they can be hidden from the public list.
const toggleDoctorStatus = asyncHandler(async (req, res) => {
  const targetStatus = req.body.isActive !== undefined ? req.body.isActive : undefined;
  const doctor = await doctorService.toggleDoctorStatus(req.params.id, targetStatus);
  return sendSuccess(res, 200, 'Doctor status updated', { doctor });
});

// Permanently deletes a doctor if they have no active appointments.
const deleteDoctor = asyncHandler(async (req, res) => {
  const result = await doctorService.deleteDoctor(req.params.id);
  return sendSuccess(res, 200, result.message, result);
});

module.exports = {
  getDoctors,
  getDoctorById,
  getDoctorsByHospital,
  createDoctor,
  updateDoctor,
  toggleDoctorStatus,
  deleteDoctor,
};
