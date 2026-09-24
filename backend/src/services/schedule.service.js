const DoctorSchedule = require('../models/doctorSchedule.model');
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const Hospital = require('../models/hospital.model');
const Notification = require('../models/notification.model');
const AppError = require('../utils/AppError');
const {
  isDateWithinScheduleWindow,
  getMinScheduleDate,
  getMaxScheduleDate,
  formatDate,
  timeToMinutes,
  isTimeOverlapping,
  isSessionExpired,
  getSessionStatus,
} = require('../utils/dateHelper');
const { APPOINTMENT_STATUS, NOTIFICATION_TYPES, BOOKING_CONSTANTS } = require('../constants');

// Helper to compute token slots per session or top-level schedule
function computeSessionTokenSlots(sessionObj, defaultConsultationFee = 350) {
  const totalTokens = sessionObj.totalTokens || 10;
  const startTimeStr = sessionObj.startTime || '10:00 AM';
  const endTimeStr = sessionObj.endTime || '01:00 PM';
  const sessionName = sessionObj.name || 'Consultation';
  const fee = sessionObj.consultationFee !== undefined ? sessionObj.consultationFee : defaultConsultationFee;

  const startMin = timeToMinutes(startTimeStr);
  const endMin = timeToMinutes(endTimeStr);
  const totalDurationMin = Math.max(20, endMin - startMin);
  const interval = Math.max(5, Math.floor(totalDurationMin / totalTokens));

  const slots = [];
  const [timePart, modifier] = startTimeStr.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  for (let i = 1; i <= totalTokens; i++) {
    const slotTotalMinutes = hours * 60 + minutes + (i - 1) * interval;
    const h = Math.floor(slotTotalMinutes / 60) % 24;
    const m = slotTotalMinutes % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m < 10 ? `0${m}` : m;
    const displayHPad = displayH < 10 ? `0${displayH}` : `${displayH}`;
    const timeFormatted = `${displayHPad}:${displayM} ${period}`;

    slots.push({
      tokenNumber: i,
      time: timeFormatted,
      sessionId: sessionObj._id,
      sessionName,
      fee,
    });
  }
  return slots;
}

// Decorates a single schedule document/object with sessions, token slots, and booking status
function decorateScheduleWithSessions(scheduleDoc, confirmedAppointments = []) {
  const sObj = typeof scheduleDoc.toObject === 'function' ? scheduleDoc.toObject() : { ...scheduleDoc };
  const sId = sObj._id.toString();

  // 1. Normalize sessions
  let sessions = Array.isArray(sObj.sessions) && sObj.sessions.length > 0 ? sObj.sessions : [];

  // Fallback: If legacy schedule has no explicit sessions array, synthesize one session from top-level fields
  if (sessions.length === 0) {
    sessions = [
      {
        _id: sObj._id, // fallback ID
        name: 'Consultation',
        startTime: sObj.startTime || '10:00 AM',
        endTime: sObj.endTime || '01:00 PM',
        totalTokens: sObj.totalTokens || 20,
        consultationFee: sObj.consultationFee !== undefined ? sObj.consultationFee : 350,
        isAvailable: sObj.isAvailable !== false,
      },
    ];
  }

  // 2. Filter confirmed appointments for this schedule
  const scheduleAppointments = confirmedAppointments.filter(
    (a) => (a.schedule?._id || a.schedule || '').toString() === sId
  );

  // Group booked tokens by sessionId (or scheduleId fallback)
  const bookedBySession = {};
  scheduleAppointments.forEach((app) => {
    const sessKey = (app.sessionId || sId).toString();
    if (!bookedBySession[sessKey]) bookedBySession[sessKey] = [];
    bookedBySession[sessKey].push(app.tokenNumber);
  });

  // 3. Decorate each session
  let overallTotalTokens = 0;
  let overallBookedCount = 0;
  const now = new Date();

  const decoratedSessions = sessions.map((sess) => {
    const sessIdStr = (sess._id || sId).toString();
    const bookedTokens = bookedBySession[sessIdStr] || [];
    const totalTokens = sess.totalTokens || 10;
    const availableCount = Math.max(0, totalTokens - bookedTokens.length);
    const isFullyBooked = bookedTokens.length >= totalTokens;

    const startTimeStr = sess.startTime || sObj.startTime || '10:00 AM';
    const endTimeStr = sess.endTime || sObj.endTime || '01:00 PM';
    const isExpired = isSessionExpired(sObj.date, endTimeStr, now);
    const timeStatus = getSessionStatus(sObj.date, startTimeStr, endTimeStr, now);

    overallTotalTokens += totalTokens;
    overallBookedCount += bookedTokens.length;

    const slots = computeSessionTokenSlots(sess, sObj.consultationFee).map((slot) => ({
      ...slot,
      isBooked: bookedTokens.includes(slot.tokenNumber),
      isExpired,
    }));

    return {
      ...sess,
      _id: sess._id || sessIdStr,
      bookedTokens,
      bookedTokensCount: bookedTokens.length,
      availableTokensCount: availableCount,
      isFullyBooked,
      isExpired,
      timeStatus,
      isBookable: sess.isAvailable !== false && !isExpired && !isFullyBooked,
      slots,
    };
  });

  sObj.sessions = decoratedSessions;
  sObj.totalTokens = overallTotalTokens || sObj.totalTokens || 20;
  sObj.bookedTokensCount = overallBookedCount;
  sObj.availableTokensCount = Math.max(0, sObj.totalTokens - overallBookedCount);
  sObj.isFullyBooked = overallBookedCount >= sObj.totalTokens;

  // Flattened all slots for convenient fallback
  sObj.slots = decoratedSessions.flatMap((ds) => ds.slots);

  // Overall consultation time span
  if (decoratedSessions.length > 0) {
    sObj.startTime = decoratedSessions[0].startTime;
    sObj.endTime = decoratedSessions[decoratedSessions.length - 1].endTime;
    sObj.isExpired = decoratedSessions.every((ds) => ds.isExpired);
    sObj.hasBookableSessions = decoratedSessions.some((ds) => ds.isBookable);
  } else {
    sObj.isExpired = isSessionExpired(sObj.date, sObj.endTime || '08:00 PM', now);
    sObj.hasBookableSessions = sObj.isAvailable !== false && !sObj.isExpired && !sObj.isFullyBooked;
  }

  return sObj;
}

class ScheduleService {
  /**
   * Helper to validate session list times and non-overlapping constraints
   */
  validateSessionsList(sessions = []) {
    if (!Array.isArray(sessions) || sessions.length === 0) {
      throw new AppError('At least one consultation session is required.', 400);
    }

    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      if (!s.startTime || !s.endTime) {
        throw new AppError(`Session #${i + 1} must have valid start and end times.`, 400);
      }
      const startMin = timeToMinutes(s.startTime);
      const endMin = timeToMinutes(s.endTime);

      if (startMin < 0 || endMin < 0 || startMin >= endMin) {
        throw new AppError(
          `Session "${s.name || i + 1}": End time must be later than the start time.`,
          400
        );
      }

      if (s.totalTokens !== undefined && Number(s.totalTokens) < 1) {
        throw new AppError(`Session "${s.name || i + 1}": Total tokens must be at least 1.`, 400);
      }
    }

    // Check for pairwise overlaps
    for (let i = 0; i < sessions.length; i++) {
      for (let j = i + 1; j < sessions.length; j++) {
        const sA = sessions[i];
        const sB = sessions[j];
        if (isTimeOverlapping(sA.startTime, sA.endTime, sB.startTime, sB.endTime)) {
          throw new AppError(
            `Consultation sessions cannot overlap: "${sA.name || 'Session ' + (i + 1)}" and "${sB.name || 'Session ' + (j + 1)}" conflict.`,
            400
          );
        }
      }
    }
  }

  /**
   * Prevents a doctor from having overlapping schedules across any location (Hospital, Clinic, Home, etc.)
   */
  async validateDoctorScheduleConflict(doctorId, date, newStartTime, newEndTime, excludeScheduleId = null) {
    const query = {
      doctor: doctorId,
      date: date,
      isAvailable: true,
    };
    if (excludeScheduleId) {
      query._id = { $ne: excludeScheduleId };
    }

    const existingSchedules = await DoctorSchedule.find(query).populate('location', 'name facilityType');

    for (const sched of existingSchedules) {
      // Compare the overall start and end times
      if (isTimeOverlapping(sched.startTime, sched.endTime, newStartTime, newEndTime)) {
        const locName = sched.location ? sched.location.name : 'another location';
        const msg = `Doctor is already scheduled at ${locName} from ${sched.startTime} to ${sched.endTime} on ${date}. The doctor cannot be scheduled for another service during this time.`;
        const error = new AppError(msg, 409);
        error.code = 'DOCTOR_SCHEDULE_CONFLICT';
        throw error;
      }
    }
  }

  async getDoctorSchedules(doctorId) {
    const minDateStr = getMinScheduleDate();
    const maxDateStr = getMaxScheduleDate();

    const schedules = await DoctorSchedule.find({
      doctor: doctorId,
      date: { $gte: minDateStr, $lte: maxDateStr },
      isAvailable: true,
    })
      .populate('location', 'name address city facilityType phone')
      .sort({ date: 1, startTime: 1 });

    const scheduleIds = schedules.map((s) => s._id);
    const confirmedAppointments = await Appointment.find({
      schedule: { $in: scheduleIds },
      status: APPOINTMENT_STATUS.CONFIRMED,
    }).select('schedule sessionId tokenNumber').lean();

    return schedules.map((sched) => decorateScheduleWithSessions(sched, confirmedAppointments));
  }

  async getScheduleById(id) {
    const schedule = await DoctorSchedule.findById(id)
      .populate('doctor', 'name specialization qualification consultationFee image')
      .populate('location', 'name address city phone facilityType');

    if (!schedule) {
      throw new AppError('Schedule not found.', 404);
    }

    const confirmedAppointments = await Appointment.find({
      schedule: id,
      status: APPOINTMENT_STATUS.CONFIRMED,
    }).select('schedule sessionId tokenNumber').lean();

    return decorateScheduleWithSessions(schedule, confirmedAppointments);
  }

  async createSchedule(data) {
    if (!isDateWithinScheduleWindow(data.date)) {
      throw new AppError('Schedule date must be between tomorrow and 2 months from today.', 400);
    }

    // 1. Verify Doctor exists and is assigned to the specified Facility
    const doctor = await Doctor.findById(data.doctor);
    if (!doctor) {
      throw new AppError('Doctor not found.', 404);
    }

    const facility = await Hospital.findById(data.location);
    if (!facility) {
      throw new AppError('Healthcare facility not found.', 404);
    }

    const isAssigned = (doctor.hospitals || []).some(
      (h) => h.toString() === data.location.toString()
    );
    if (!isAssigned) {
      throw new AppError('Doctor is not assigned to this facility.', 400);
    }

    // 2. Prevent duplicate schedule for same doctor + same facility + same date
    const existing = await DoctorSchedule.findOne({
      doctor: data.doctor,
      location: data.location,
      date: data.date,
    });
    if (existing) {
      throw new AppError('A schedule already exists for this doctor at this facility on this date.', 409);
    }

    // 3. If sessions provided, validate them and auto-sort by startTime
    let schedulePayload = { ...data };
    if (data.sessions && Array.isArray(data.sessions) && data.sessions.length > 0) {
      this.validateSessionsList(data.sessions);
      // Sort sessions chronologically ascending
      schedulePayload.sessions = [...data.sessions].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      );
      schedulePayload.totalTokens = schedulePayload.sessions.reduce((acc, s) => acc + (Number(s.totalTokens) || 0), 0);
      schedulePayload.startTime = schedulePayload.sessions[0].startTime;
      schedulePayload.endTime = schedulePayload.sessions[schedulePayload.sessions.length - 1].endTime;
      schedulePayload.consultationFee = schedulePayload.sessions[0].consultationFee || 350;
    } else {
      // Create a default session matching the single schedule inputs
      const defaultSess = {
        name: data.sessionName || 'Consultation',
        startTime: data.startTime || '10:00 AM',
        endTime: data.endTime || '01:00 PM',
        totalTokens: Number(data.totalTokens) || 20,
        consultationFee: Number(data.consultationFee) || 350,
        isAvailable: data.isAvailable !== false,
      };
      this.validateSessionsList([defaultSess]);
      schedulePayload.sessions = [defaultSess];
      schedulePayload.totalTokens = defaultSess.totalTokens;
      schedulePayload.startTime = defaultSess.startTime;
      schedulePayload.endTime = defaultSess.endTime;
      schedulePayload.consultationFee = defaultSess.consultationFee;
    }

    // 4. Validate time conflict across all locations for this doctor on this date
    await this.validateDoctorScheduleConflict(
      schedulePayload.doctor,
      schedulePayload.date,
      schedulePayload.startTime,
      schedulePayload.endTime
    );

    const created = await DoctorSchedule.create(schedulePayload);
    return created;
  }

  async updateSchedule(id, data) {
    const existingSchedule = await DoctorSchedule.findById(id);
    if (!existingSchedule) {
      throw new AppError('Schedule not found to update.', 404);
    }

    let updatePayload = { ...data };

    // If sessions are provided in update
    if (data.sessions && Array.isArray(data.sessions)) {
      this.validateSessionsList(data.sessions);
      updatePayload.sessions = [...data.sessions].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      );
      updatePayload.totalTokens = updatePayload.sessions.reduce((acc, s) => acc + (Number(s.totalTokens) || 0), 0);
      updatePayload.startTime = updatePayload.sessions[0].startTime;
      updatePayload.endTime = updatePayload.sessions[updatePayload.sessions.length - 1].endTime;
      if (updatePayload.sessions[0].consultationFee !== undefined) {
        updatePayload.consultationFee = updatePayload.sessions[0].consultationFee;
      }
    }

    // Capacity validation: Cannot reduce totalTokens below already booked token count
    if (updatePayload.totalTokens !== undefined && Number(updatePayload.totalTokens) < existingSchedule.totalTokens) {
      const bookedCount = await Appointment.countDocuments({
        schedule: id,
        status: APPOINTMENT_STATUS.CONFIRMED,
      });

      if (Number(updatePayload.totalTokens) < bookedCount) {
        throw new AppError(
          `Token capacity cannot be reduced below the number of already booked tokens (${bookedCount}).`,
          400
        );
      }
    }

    // If date is being modified, validate booking window
    if (data.date && data.date !== existingSchedule.date) {
      if (!isDateWithinScheduleWindow(data.date)) {
        throw new AppError('Schedule date must be between tomorrow and 2 months from today.', 400);
      }
    }

    // Determine final date and times for conflict check
    const finalDate = updatePayload.date || existingSchedule.date;
    const finalStartTime = updatePayload.startTime || existingSchedule.startTime;
    const finalEndTime = updatePayload.endTime || existingSchedule.endTime;

    // Validate time conflict across all locations for this doctor on this date
    // Exclude the current schedule from the check
    await this.validateDoctorScheduleConflict(
      existingSchedule.doctor,
      finalDate,
      finalStartTime,
      finalEndTime,
      id
    );

    const schedule = await DoctorSchedule.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    return schedule;
  }

  async deleteSchedule(id) {
    const schedule = await DoctorSchedule.findById(id);
    if (!schedule) {
      throw new AppError('Schedule not found.', 404);
    }

    // Check if any active or past appointments exist for this schedule
    const appointmentCount = await Appointment.countDocuments({ schedule: id });
    if (appointmentCount > 0) {
      throw new AppError(
        'This schedule has existing appointments and cannot be deleted. Please mark it unavailable instead.',
        400
      );
    }

    await DoctorSchedule.findByIdAndDelete(id);
    return { id, message: 'Schedule deleted successfully.' };
  }

  async toggleScheduleAvailability(id) {
    const schedule = await DoctorSchedule.findById(id).populate('doctor', 'name');
    if (!schedule) {
      throw new AppError('Schedule not found.', 404);
    }

    if (!schedule.isAvailable) {
      // It is currently unavailable, we are making it available
      // Check for conflicts before making it available
      await this.validateDoctorScheduleConflict(
        schedule.doctor._id || schedule.doctor,
        schedule.date,
        schedule.startTime,
        schedule.endTime,
        id
      );
    }

    schedule.isAvailable = !schedule.isAvailable;
    await schedule.save();

    if (!schedule.isAvailable) {
      const affectedAppointments = await Appointment.find({
        schedule: id,
        status: APPOINTMENT_STATUS.CONFIRMED,
      });

      if (affectedAppointments.length > 0) {
        await Appointment.updateMany(
          { schedule: id, status: APPOINTMENT_STATUS.CONFIRMED },
          { $set: { status: APPOINTMENT_STATUS.CANCELLED } }
        );

        const notifications = affectedAppointments.map((app) => ({
          user: app.user,
          type: NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
          title: 'Appointment Cancelled by Doctor',
          message: `Your appointment with Dr. ${schedule.doctor.name} on ${schedule.date} (${app.sessionName ? app.sessionName + ' ' : ''}Token #${app.tokenNumber}) has been cancelled due to doctor unavailability.`,
          appointment: app._id,
        }));

        await Notification.insertMany(notifications);
      }
    }

    return schedule;
  }
}

module.exports = new ScheduleService();
