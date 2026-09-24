const mongoose = require('mongoose');
const Appointment = require('../models/appointment.model');
const DoctorSchedule = require('../models/doctorSchedule.model');
const WaitingList = require('../models/waitingList.model');
const Notification = require('../models/notification.model');
const AppError = require('../utils/AppError');
const { isCancellationAllowed } = require('../utils/dateHelper');
const { APPOINTMENT_STATUS, WAITING_LIST_STATUS, NOTIFICATION_TYPES } = require('../constants');

class AppointmentCancellationService {
  /**
   * CANCEL APPOINTMENT WITH SESSION-SCOPED QUEUE COMPACTION & WAITING LIST PROMOTION
   *
   * Rules:
   * 1. Cancellation Deadline: Only permitted when currentTime < sessionStartTime - 1 hour.
   * 2. When Token N is cancelled: All subsequent active confirmed appointments (N+1..total)
   *    in the SAME session shift forward by 1 (e.g. 14 -> 13, 15 -> 14, ..., 20 -> 19).
   * 3. Two-phase token renumbering avoids compound unique index { schedule: 1, sessionId: 1, tokenNumber: 1 } collisions.
   * 4. Waiting List Promotion: If active waiting list entries exist for this session:
   *    - #1 waiting user is promoted to the LAST token of this session with a confirmed appointment.
   *    - Waiting list record status set to 'promoted'.
   *    - Remaining waiting list entries shift positions (e.g. #2 -> #1, #3 -> #2).
   * 5. Notifications:
   *    - Cancelling user: cancellation confirmation.
   *    - Every user whose token changed: specific token shift notification (persisted in DB).
   *    - Promoted user: promotion & confirmed token notification with session name.
   */
  async cancelAppointment(appointmentId, actorUserId, isAdmin = false) {
    const isReplicaSet = Boolean(
      mongoose.connection?.client?.topology?.description?.type === 'ReplicaSetWithPrimary' ||
      mongoose.connection?.client?.topology?.description?.servers?.size > 1
    );

    if (isReplicaSet) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const result = await this._executeCancellation(appointmentId, actorUserId, isAdmin, session);
        await session.commitTransaction();
        return result;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      return this._executeCancellation(appointmentId, actorUserId, isAdmin, null);
    }
  }

  async _executeCancellation(appointmentId, actorUserId, isAdmin, session) {
    const sessionOpt = session ? { session } : {};

    // 1. Fetch and validate appointment
    let appointmentQuery = Appointment.findById(appointmentId)
      .populate('doctor', 'name')
      .populate('hospital', 'name')
      .populate('schedule');

    if (session) appointmentQuery = appointmentQuery.session(session);
    const appointment = await appointmentQuery;

    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    if (!isAdmin && appointment.user.toString() !== actorUserId.toString()) {
      throw new AppError('You can only cancel your own appointments.', 403);
    }

    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      throw new AppError('This appointment has already been cancelled.', 400);
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      throw new AppError('Completed appointments cannot be cancelled.', 400);
    }

    // 2. Fetch Schedule and locate specific Session
    let schedule = appointment.schedule;
    if (!schedule || !schedule.startTime) {
      let scheduleQuery = DoctorSchedule.findById(appointment.schedule);
      if (session) scheduleQuery = scheduleQuery.session(session);
      schedule = await scheduleQuery;
    }

    if (!schedule) {
      throw new AppError('Associated doctor schedule not found.', 404);
    }

    // Determine session start time for accurate deadline calculation
    let sessionStartTime = schedule.startTime || '10:00 AM';
    let targetSession = null;
    if (appointment.sessionId && schedule.sessions && schedule.sessions.length > 0) {
      targetSession = schedule.sessions.find(
        (s) => s._id.toString() === appointment.sessionId.toString()
      );
      if (targetSession?.startTime) {
        sessionStartTime = targetSession.startTime;
      }
    }

    // 3. Validate Cancellation Deadline (sessionStartTime - 1 hour)
    const allowed = isCancellationAllowed(appointment.date, sessionStartTime, new Date());
    if (!allowed) {
      throw new AppError(
        'Cancellation is no longer available. Tokens can only be cancelled at least 1 hour before the consultation starts.',
        409
      );
    }

    const cancelledTokenNumber = appointment.tokenNumber;
    const scheduleId = schedule._id;
    const targetSessionId = appointment.sessionId || undefined;
    const sessionName = appointment.sessionName || targetSession?.name || 'Consultation';

    // 4. Mark the target appointment as cancelled
    appointment.status = APPOINTMENT_STATUS.CANCELLED;
    await appointment.save(sessionOpt);

    // Notify the cancelling user
    const sessionText = sessionName && sessionName !== 'Consultation' ? ` (${sessionName})` : '';
    await Notification.create(
      [
        {
          user: appointment.user,
          type: NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
          title: 'Appointment Cancelled',
          message: `Your appointment for Token #${cancelledTokenNumber}${sessionText} on ${appointment.date} was cancelled.`,
          appointment: appointment._id,
        },
      ],
      sessionOpt
    );

    // 5. Find active confirmed appointments in the SAME session with tokenNumber > cancelledTokenNumber
    const subsequentFilter = {
      schedule: scheduleId,
      status: APPOINTMENT_STATUS.CONFIRMED,
      tokenNumber: { $gt: cancelledTokenNumber },
    };
    if (targetSessionId) {
      subsequentFilter.sessionId = targetSessionId;
    }

    let subsequentQuery = Appointment.find(subsequentFilter).sort({ tokenNumber: 1 });
    if (session) subsequentQuery = subsequentQuery.session(session);
    const subsequentAppointments = await subsequentQuery;

    // 6. Safe Two-Phase Token Renumbering to prevent unique index collisions
    // Phase 1: Shift to temporary non-colliding values (e.g. 10000 + tokenNumber)
    for (const app of subsequentAppointments) {
      app.tokenNumber = 10000 + app.tokenNumber;
      await app.save(sessionOpt);
    }

    // Phase 2: Assign new continuous token numbers (oldToken - 1)
    const tokenChangeNotifications = [];
    let lastOccupiedToken = cancelledTokenNumber - 1;

    for (const app of subsequentAppointments) {
      const oldToken = app.tokenNumber - 10000;
      const newToken = oldToken - 1;
      app.tokenNumber = newToken;
      await app.save(sessionOpt);

      lastOccupiedToken = newToken;

      // Prepare token shift notification
      const sessionLabel = app.sessionName && app.sessionName !== 'Consultation' ? ` for the ${app.sessionName} session` : '';
      tokenChangeNotifications.push({
        user: app.user,
        type: NOTIFICATION_TYPES.TOKEN_CHANGED,
        title: 'Token Number Updated',
        message: `Your token number${sessionLabel} has changed from ${oldToken} to ${newToken} because an earlier appointment was cancelled.`,
        appointment: app._id,
      });
    }

    // Persist token shift notifications
    if (tokenChangeNotifications.length > 0) {
      await Notification.create(tokenChangeNotifications, sessionOpt);
    }

    // 7. Check Waiting List for Promotion (session-scoped)
    const waitFilter = {
      schedule: scheduleId,
      status: WAITING_LIST_STATUS.WAITING,
    };
    if (targetSessionId) {
      waitFilter.sessionId = targetSessionId;
    }

    let waitingQuery = WaitingList.findOne(waitFilter).sort({ position: 1 });
    if (session) waitingQuery = waitingQuery.session(session);
    const nextWaitingUser = await waitingQuery;

    if (nextWaitingUser) {
      const promotedTokenNumber = lastOccupiedToken + 1;

      // Mark waiting list entry as promoted
      nextWaitingUser.status = WAITING_LIST_STATUS.PROMOTED;
      await nextWaitingUser.save(sessionOpt);

      const sessionFee = targetSession?.consultationFee !== undefined
        ? targetSession.consultationFee
        : (schedule.consultationFee || 350);

      // Create confirmed appointment for promoted user at the end of the session queue
      const promotedAppointmentDocs = await Appointment.create(
        [
          {
            user: nextWaitingUser.user,
            doctor: appointment.doctor._id || appointment.doctor,
            hospital: appointment.hospital._id || appointment.hospital,
            schedule: scheduleId,
            sessionId: targetSessionId,
            sessionName,
            tokenNumber: promotedTokenNumber,
            date: appointment.date,
            consultationFee: sessionFee,
            patient: nextWaitingUser.patient,
            status: APPOINTMENT_STATUS.CONFIRMED,
          },
        ],
        sessionOpt
      );

      const promotedAppointment = promotedAppointmentDocs[0];

      // Shift remaining waiting list positions for this session (#2 -> #1, #3 -> #2, etc.)
      const shiftWaitFilter = {
        schedule: scheduleId,
        status: WAITING_LIST_STATUS.WAITING,
        position: { $gt: nextWaitingUser.position },
      };
      if (targetSessionId) {
        shiftWaitFilter.sessionId = targetSessionId;
      }

      await WaitingList.updateMany(
        shiftWaitFilter,
        { $inc: { position: -1 } },
        sessionOpt
      );

      // Notify promoted waiting-list user
      const doctorDisplayName = appointment.doctor?.name
        ? `Dr. ${appointment.doctor.name.replace(/^dr\.?\s*/i, '')}`
        : 'your doctor';

      const promoSessionText = sessionName && sessionName !== 'Consultation' ? ` for the ${sessionName} session` : '';

      await Notification.create(
        [
          {
            user: nextWaitingUser.user,
            type: NOTIFICATION_TYPES.WAITING_LIST_PROMOTED,
            title: 'Appointment Confirmed',
            message: `You have been promoted from the waiting list. Your token number is ${promotedTokenNumber}${promoSessionText} for your appointment with ${doctorDisplayName} on ${appointment.date}.`,
            appointment: promotedAppointment._id,
          },
        ],
        sessionOpt
      );
    }

    return appointment;
  }
}

module.exports = new AppointmentCancellationService();
