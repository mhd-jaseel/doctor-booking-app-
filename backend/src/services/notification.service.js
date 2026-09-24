const Notification = require('../models/notification.model');
const AppError = require('../utils/AppError');
const { getPagination, buildPaginationMetadata } = require('../utils/pagination');

class NotificationService {
  async getUserNotifications(userId, query = {}) {
    const { page, limit, skip } = getPagination(query.page, query.limit, 10, 50);
    const filter = { user: userId };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: userId, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: buildPaginationMetadata(total, page, limit),
    };
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({ _id: notificationId, user: userId });
    if (!notification) {
      throw new AppError('Notification not found.', 404);
    }
    notification.isRead = true;
    await notification.save();
    return notification;
  }

  async markAllAsRead(userId) {
    await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });
    return { success: true };
  }
}

module.exports = new NotificationService();
