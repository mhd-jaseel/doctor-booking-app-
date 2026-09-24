const mongoose = require('mongoose');
const WaitingList = require('../models/waitingList.model');
const DoctorSchedule = require('../models/doctorSchedule.model');
const Appointment = require('../models/appointment.model');
const AppError = require('../utils/AppError');
const { BOOKING_CONSTANTS, WAITING_LIST_STATUS, APPOINTMENT_STATUS } = require('../constants');
const { isSessionExpired } = require('../utils/dateHelper');

class WaitingListService {
  async joinWaitingList(userId, { scheduleId, sessionId, patient }) {
    const schedule = await DoctorSchedule.findById(scheduleId);
    if (!schedule || !schedule.isAvailable) {
      throw new AppError('This schedule is no longer available.', 400);
    }

    let targetSession = null;
    if (schedule.sessions && schedule.sessions.length > 0) {
      if (sessionId) {
        targetSession = schedule.sessions.find((s) => s._id.toString() === sessionId.toString());
      }
      if (!targetSession) {
        targetSession = schedule.sessions[0];
      }
    }

    const sessionEndTime = targetSession?.endTime || schedule.endTime || '08:00 PM';
    if (isSessionExpired(schedule.date, sessionEndTime, new Date())) {
      throw new AppError(
        'This consultation session has ended. Waiting list is closed.',
        400
      );
    }

    const sessionTotalTokens = targetSession ? targetSession.totalTokens : (schedule.totalTokens || 20);

    // Only allow waiting list if ALL tokens for this session are currently booked
    const appFilter = {
      schedule: scheduleId,
      status: APPOINTMENT_STATUS.CONFIRMED,
    };
    if (targetSession?._id) {
      appFilter.sessionId = targetSession._id;
    }

    const activeAppointmentsCount = await Appointment.countDocuments(appFilter);

    if (activeAppointmentsCount < sessionTotalTokens) {
      throw new AppError('Tokens are still available. Please book an available token directly.', 400);
    }

    // Check duplicate active entry
    const waitFilter = {
      user: userId,
      schedule: scheduleId,
      status: WAITING_LIST_STATUS.WAITING,
    };
    if (targetSession?._id) {
      waitFilter.sessionId = targetSession._id;
    }

    const existing = await WaitingList.findOne(waitFilter);
    if (existing) {
      throw new AppError(`You are already in the waiting list at position #${existing.position}.`, 409);
    }

    // Count current waiting entries for this session
    const currentWaitingCount = await WaitingList.countDocuments({
      schedule: scheduleId,
      sessionId: targetSession?._id || undefined,
      status: WAITING_LIST_STATUS.WAITING,
    });

    if (currentWaitingCount >= BOOKING_CONSTANTS.MAX_WAITING_LIST) {
      throw new AppError('Waiting list is full. Maximum 5 patients can wait for this session.', 400);
    }

    const position = currentWaitingCount + 1;

    const entry = await WaitingList.create({
      user: userId,
      schedule: scheduleId,
      sessionId: targetSession?._id || undefined,
      patient,
      position,
      status: WAITING_LIST_STATUS.WAITING,
    });

    return entry;
  }

  async getMyWaitingListEntries(userId) {
    return WaitingList.find({ user: userId, status: WAITING_LIST_STATUS.WAITING })
      .populate({
        path: 'schedule',
        populate: [
          { path: 'doctor', select: 'name specialization image' },
          { path: 'location', select: 'name address city' },
        ],
      })
      .sort({ createdAt: -1 });
  }

  async getScheduleWaitingList(scheduleId) {
    return WaitingList.find({ schedule: scheduleId, status: WAITING_LIST_STATUS.WAITING })
      .select('position status createdAt')
      .sort({ position: 1 });
  }
}

module.exports = new WaitingListService();
