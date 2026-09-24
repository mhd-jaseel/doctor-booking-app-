const healthcareService = require('../services/healthcareService.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// Public User Endpoint
const getActiveServices = asyncHandler(async (req, res) => {
  const services = await healthcareService.getActiveServices();
  return sendSuccess(res, 200, 'Active healthcare services fetched successfully', { services });
});

// Admin Endpoints
const getAllServices = asyncHandler(async (req, res) => {
  const result = await healthcareService.getAllServices(req.query);
  return sendSuccess(
    res,
    200,
    'Healthcare services fetched successfully',
    { services: result.services },
    result.pagination
  );
});

const createService = asyncHandler(async (req, res) => {
  const service = await healthcareService.createService(req.body);
  return sendSuccess(res, 201, 'Healthcare service created successfully', { service });
});

const updateService = asyncHandler(async (req, res) => {
  const service = await healthcareService.updateService(req.params.id, req.body);
  return sendSuccess(res, 200, 'Healthcare service updated successfully', { service });
});

const toggleStatus = asyncHandler(async (req, res) => {
  const service = await healthcareService.toggleStatus(req.params.id);
  return sendSuccess(res, 200, 'Healthcare service status updated', { service });
});

const deleteService = asyncHandler(async (req, res) => {
  const result = await healthcareService.deleteService(req.params.id);
  return sendSuccess(res, 200, result.message, null);
});

module.exports = {
  getActiveServices,
  getAllServices,
  createService,
  updateService,
  toggleStatus,
  deleteService,
};
