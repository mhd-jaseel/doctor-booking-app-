const waitingListService = require('../services/waitingList.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const joinWaitingList = asyncHandler(async (req, res) => {
  const entry = await waitingListService.joinWaitingList(req.user._id, req.body);
  return sendSuccess(res, 201, `Joined waiting list at position #${entry.position}`, { entry });
});

const getMyWaitingList = asyncHandler(async (req, res) => {
  const entries = await waitingListService.getMyWaitingListEntries(req.user._id);
  return sendSuccess(res, 200, 'Waiting list entries fetched', { entries });
});

const getScheduleWaitingList = asyncHandler(async (req, res) => {
  const entries = await waitingListService.getScheduleWaitingList(req.params.scheduleId);
  return sendSuccess(res, 200, 'Schedule waiting list fetched', { entries });
});

module.exports = {
  joinWaitingList,
  getMyWaitingList,
  getScheduleWaitingList,
};
