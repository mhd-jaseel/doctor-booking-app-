const hospitalService = require('../services/hospital.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// Fetches a paginated list of all active healthcare facilities.
const getHospitals = asyncHandler(async (req, res) => {
  const result = await hospitalService.getAllHospitals(req.query);
  return sendSuccess(res, 200, 'Hospitals fetched successfully', { hospitals: result.hospitals }, result.pagination);
});

// Retrieves public profile details for a specific healthcare facility.
const getHospitalById = asyncHandler(async (req, res) => {
  const hospital = await hospitalService.getHospitalById(req.params.id);
  return sendSuccess(res, 200, 'Hospital details fetched successfully', { hospital });
});

// Creates a new healthcare facility from the Admin panel.
const createHospital = asyncHandler(async (req, res) => {
  const hospital = await hospitalService.createHospital(req.body);
  return sendSuccess(res, 201, 'Hospital created successfully', { hospital });
});

// Updates an existing healthcare facility from the Admin panel.
const updateHospital = asyncHandler(async (req, res) => {
  const hospital = await hospitalService.updateHospital(req.params.id, req.body);
  return sendSuccess(res, 200, 'Hospital updated successfully', { hospital });
});

// Activates or deactivates a facility so it can be hidden from the public list.
const toggleHospitalStatus = asyncHandler(async (req, res) => {
  const targetStatus = req.body.isActive !== undefined ? req.body.isActive : undefined;
  const hospital = await hospitalService.toggleHospitalStatus(req.params.id, targetStatus);
  return sendSuccess(res, 200, 'Hospital status updated', { hospital });
});

// Permanently deletes a facility if it has no assigned doctors or active appointments.
const deleteHospital = asyncHandler(async (req, res) => {
  const result = await hospitalService.deleteHospital(req.params.id);
  return sendSuccess(res, 200, result.message, result);
});

module.exports = {
  getHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  toggleHospitalStatus,
  deleteHospital,
};
