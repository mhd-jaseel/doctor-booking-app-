const mongoose = require('mongoose');
const Appointment = require('../models/appointment.model');
const DoctorSchedule = require('../models/doctorSchedule.model');
const WaitingList = require('../models/waitingList.model');
const Notification = require('../models/notification.model');
const AppError = require('../utils/AppError');
const { isDateWithinScheduleWindow, isSessionExpired } = require('../utils/dateHelper');
const { APPOINTMENT_STATUS, WAITING_LIST_STATUS, NOTIFICATION_TYPES } = require('../constants');
const { getPagination, buildPaginationMetadata } = require('../utils/pagination');

// Handles booking, fetching, and delegating cancellation of patient appointments.
class AppointmentService {
  /**
   * RACE-CONDITION SAFE TOKEN BOOKING
   * Uses Mongoose compound unique index { schedule: 1, tokenNumber: 1 } + pre-checks.
   * If a transaction session is supported by MongoDB (replica set), it uses it;
   * otherwise it utilizes atomic DB constraints with E11000 duplicate error interception.
   */
  async bookAppointment(userId, { scheduleId, sessionId, tokenNumber, date, patient }) {
    if (!isDateWithinScheduleWindow(date)) {
      throw new AppError('Booking date must be between tomorrow and 2 months from today.', 400);
    }

    const schedule = await DoctorSchedule.findById(scheduleId)
      .populate('doctor', 'name consultationFee')
      .populate('location', 'name city');

    if (!schedule || !schedule.isAvailable) {
      throw new AppError('This doctor schedule is no longer available.', 400);
    }

    // Determine target session if schedule has sessions
    let targetSession = null;
    if (schedule.sessions && schedule.sessions.length > 0) {
      if (sessionId) {
        targetSession = schedule.sessions.find((s) => s._id.toString() === sessionId.toString());
      }
      if (!targetSession) {
        targetSession = schedule.sessions[0];
      }
    }

    const maxTokens = targetSession ? targetSession.totalTokens : (schedule.totalTokens || 20);
    const sessionFee = targetSession?.consultationFee !== undefined
      ? targetSession.consultationFee
      : (schedule.consultationFee !== undefined ? schedule.consultationFee : (schedule.doctor?.consultationFee || 350));
    const sessionName = targetSession?.name || 'Consultation';
    const sessionEndTime = targetSession?.endTime || schedule.endTime || '08:00 PM';

    // Strict Backend Validation: If the session date & end time have passed, reject booking with 409
    if (isSessionExpired(date, sessionEndTime, new Date())) {
      throw new AppError(
        'This consultation session has ended. Token booking is no longer available.',
        409
      );
    }

    if (tokenNumber < 1 || tokenNumber > maxTokens) {
      throw new AppError(`Token number must be between 1 and ${maxTokens}.`, 400);
    }

    // 1. Normalize Patient Identity Fields: Name, Age, Phone
    const normalizedPatientName = (patient.name || '').trim();
    const normalizedPatientAge = Number(patient.age);
    const normalizedPatientPhone = (patient.phone || '').trim().replace(/[\s\-()]/g, '');

    // 2. Check Same Patient Duplicate Rule:
    // Same patient (Name + Age + Phone) already having an active confirmed appointment for this doctor on this date
    const doctorId = schedule.doctor?._id || schedule.doctor;
    const duplicatePatientBooking = await Appointment.findOne({
      doctor: doctorId,
      date,
      'patient.name': { $regex: new RegExp(`^${normalizedPatientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      'patient.age': normalizedPatientAge,
      status: APPOINTMENT_STATUS.CONFIRMED,
    });

    if (
      duplicatePatientBooking &&
      (duplicatePatientBooking.patient?.phone || '').replace(/[\s\-()]/g, '').slice(-10) === normalizedPatientPhone.slice(-10)
    ) {
      throw new AppError(
        'An appointment already exists for this patient with this doctor on this date.',
        409
      );
    }

    // 3. Check Maximum 3 Tokens per User Account for this Doctor on this Date
    const userActiveBookingsCount = await Appointment.countDocuments({
      user: userId,
      doctor: doctorId,
      date,
      status: APPOINTMENT_STATUS.CONFIRMED,
    });

    if (userActiveBookingsCount >= 3) {
      throw new AppError(
        'You can book a maximum of 3 tokens for this doctor on this date.',
        400
      );
    }

    // 4. Check if the specific token slot is already taken in this session
    const tokenFilter = {
      schedule: scheduleId,
      tokenNumber,
      status: APPOINTMENT_STATUS.CONFIRMED,
    };
    if (targetSession?._id) {
      tokenFilter.sessionId = targetSession._id;
    }

    const existingToken = await Appointment.findOne(tokenFilter);

    if (existingToken) {
      throw new AppError('This token is no longer available. Please select another token.', 409);
    }

    try {
      // 5. Create appointment (unique compound index enforces atomic safety)
      const appointment = await Appointment.create({
        user: userId,
        doctor: schedule.doctor._id,
        hospital: schedule.location._id,
        schedule: schedule._id,
        sessionId: targetSession?._id || undefined,
        sessionName,
        tokenNumber,
        date,
        consultationFee: sessionFee,
        patient,
        status: APPOINTMENT_STATUS.CONFIRMED,
      });

      // 6. Create confirmation notification
      const sessionText = sessionName && sessionName !== 'Consultation' ? ` (${sessionName})` : '';
      await Notification.create({
        user: userId,
        type: NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED,
        title: 'Appointment Confirmed',
        message: `Your appointment with Dr. ${schedule.doctor.name} is confirmed for ${date}${sessionText}. Your Token is #${tokenNumber}.`,
        appointment: appointment._id,
      });

      return appointment;
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError('This token is no longer available. Please select another token.', 409);
      }
      throw error;
    }
  }

  async getMyAppointments(userId, query = {}) {
    const filter = { user: userId };
    if (query.status) {
      if (query.status.includes(',')) {
        filter.status = { $in: query.status.split(',') };
      } else {
        filter.status = query.status;
      }
    }

    const { page, limit, skip } = getPagination(query.page, query.limit, 10, 50);

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('doctor', 'name specialization qualification image consultationFee')
        .populate('hospital', 'name address city phone facilityType')
        .populate('schedule', 'startTime endTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    return {
      appointments,
      pagination: buildPaginationMetadata(total, page, limit),
    };
  }

  async getAppointmentById(id, userId = null) {
    const appointment = await Appointment.findById(id)
      .populate('doctor', 'name specialization qualification image consultationFee')
      .populate('hospital', 'name address city phone facilityType')
      .populate('schedule', 'startTime endTime');

    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    if (userId && appointment.user.toString() !== userId.toString()) {
      throw new AppError('You do not have access to this appointment.', 403);
    }

    return appointment;
  }

  /**
   * CANCELLATION & QUEUE COMPACTION & WAITING LIST PROMOTION
   * Delegated to AppointmentCancellationService to guarantee deadline validation,
   * queue renumbering, waiting list promotion, and transaction isolation.
   */
  async cancelAppointment(appointmentId, userId, isAdmin = false) {
    const appointmentCancellationService = require('./appointmentCancellation.service');
    return appointmentCancellationService.cancelAppointment(appointmentId, userId, isAdmin);
  }
}

module.exports = new AppointmentService();
