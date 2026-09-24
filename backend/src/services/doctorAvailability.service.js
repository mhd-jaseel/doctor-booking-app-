const DoctorSchedule = require('../models/doctorSchedule.model');
const Appointment = require('../models/appointment.model');
const { formatDate, isSessionExpired } = require('../utils/dateHelper');
const { APPOINTMENT_STATUS } = require('../constants');

/**
 * DoctorAvailabilityService:
 * Single source of truth for calculating dynamic Today Availability for doctors.
 *
 * Rules:
 * A doctor is TODAY AVAILABLE only when:
 * 1. doctor.isActive === true
 * 2. doctor has a valid DoctorSchedule for TODAY (YYYY-MM-DD)
 * 3. schedule.isAvailable === true
 * 4. At least one session in today's schedule is active, available, and NOT expired by current time
 * 5. That session has available tokens (availableTokens > 0)
 */
class DoctorAvailabilityService {
  /**
   * Calculates today's availability for a list of doctor IDs or objects
   * @param {Array<string|Object>} doctorIds - List of Doctor ObjectIds or Doctor objects
   * @param {Date} [now] - Current date/time reference (defaults to new Date())
   * @returns {Promise<Object>} Map of doctorId -> { isAvailable, availableSlots, dateFormatted, scheduleId }
   */
  async getTodayAvailabilityMap(doctorIds, now = new Date()) {
    if (!Array.isArray(doctorIds) || doctorIds.length === 0) {
      return {};
    }

    const cleanDoctorIds = doctorIds.map((d) => (d?._id ? d._id : d));
    const todayStr = formatDate(now);

    // Fetch active schedules for today for these doctors
    const todaySchedules = await DoctorSchedule.find({
      doctor: { $in: cleanDoctorIds },
      date: todayStr,
      isAvailable: true,
    })
      .populate('location', 'name facilityType city')
      .lean();

    if (todaySchedules.length === 0) {
      const emptyMap = {};
      cleanDoctorIds.forEach((id) => {
        emptyMap[id.toString()] = {
          isAvailable: false,
          availableSlots: 0,
        };
      });
      return emptyMap;
    }

    const scheduleIds = todaySchedules.map((s) => s._id);

    // Fetch confirmed appointments for these schedules
    const confirmedAppointments = await Appointment.find({
      schedule: { $in: scheduleIds },
      status: APPOINTMENT_STATUS.CONFIRMED,
    })
      .select('schedule sessionId tokenNumber')
      .lean();

    // Map booked tokens by sessionId and scheduleId
    const bookedBySchedule = {};
    const bookedBySession = {};
    confirmedAppointments.forEach((a) => {
      const sId = (a.schedule?._id || a.schedule || '').toString();
      bookedBySchedule[sId] = (bookedBySchedule[sId] || 0) + 1;
      if (a.sessionId) {
        const sessId = a.sessionId.toString();
        bookedBySession[sessId] = (bookedBySession[sessId] || 0) + 1;
      }
    });

    const availabilityMap = {};

    // Group schedules by doctor
    const schedulesByDoctor = {};
    todaySchedules.forEach((sched) => {
      const docIdStr = (sched.doctor?._id || sched.doctor).toString();
      if (!schedulesByDoctor[docIdStr]) {
        schedulesByDoctor[docIdStr] = [];
      }
      schedulesByDoctor[docIdStr].push(sched);
    });

    cleanDoctorIds.forEach((docId) => {
      const docIdStr = docId.toString();
      const docSchedules = schedulesByDoctor[docIdStr] || [];

      let totalAvailableTokens = 0;
      let hasValidActiveSession = false;
      let primaryScheduleId = null;

      for (const sched of docSchedules) {
        const sIdStr = sched._id.toString();
        const rawSessions = Array.isArray(sched.sessions) && sched.sessions.length > 0 ? sched.sessions : [];

        if (rawSessions.length > 0) {
          for (const sess of rawSessions) {
            if (sess.isAvailable === false) continue;

            const endTimeStr = sess.endTime || sched.endTime || '08:00 PM';
            const expired = isSessionExpired(todayStr, endTimeStr, now);
            if (expired) continue;

            const sessIdStr = (sess._id || sIdStr).toString();
            const bookedCount = bookedBySession[sessIdStr] || 0;
            const total = sess.totalTokens || 10;
            const available = Math.max(0, total - bookedCount);

            if (available > 0) {
              totalAvailableTokens += available;
              hasValidActiveSession = true;
              if (!primaryScheduleId) primaryScheduleId = sched._id;
            }
          }
        } else {
          // Top-level schedule without sessions array
          const endTimeStr = sched.endTime || '08:00 PM';
          const expired = isSessionExpired(todayStr, endTimeStr, now);
          if (!expired) {
            const bookedCount = bookedBySchedule[sIdStr] || 0;
            const total = sched.totalTokens || 20;
            const available = Math.max(0, total - bookedCount);

            if (available > 0) {
              totalAvailableTokens += available;
              hasValidActiveSession = true;
              if (!primaryScheduleId) primaryScheduleId = sched._id;
            }
          }
        }
      }

      if (hasValidActiveSession && totalAvailableTokens > 0) {
        availabilityMap[docIdStr] = {
          isAvailable: true,
          dateFormatted: `${todayStr.split('-').reverse().join('-')} Today`,
          availableSlots: totalAvailableTokens,
          scheduleId: primaryScheduleId,
        };
      } else {
        availabilityMap[docIdStr] = {
          isAvailable: false,
          availableSlots: 0,
        };
      }
    });

    return availabilityMap;
  }

  /**
   * Calculates today's availability for a single doctor
   * @param {string|Object} doctorId - Doctor ID
   * @param {Date} [now] - Current date/time reference
   * @returns {Promise<Object>} { isAvailable, availableSlots, dateFormatted, scheduleId }
   */
  async getDoctorTodayAvailability(doctorId, now = new Date()) {
    const map = await this.getTodayAvailabilityMap([doctorId], now);
    const docIdStr = (doctorId?._id || doctorId).toString();
    return map[docIdStr] || { isAvailable: false, availableSlots: 0 };
  }
}

module.exports = new DoctorAvailabilityService();
