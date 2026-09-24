const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user._id, req.query);
  return sendSuccess(res, 200, 'Notifications fetched', { notifications: result.notifications, unreadCount: result.unreadCount }, result.pagination);
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user._id);
  return sendSuccess(res, 200, 'Notification marked as read', { notification });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  return sendSuccess(res, 200, 'All notifications marked as read', result);
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
