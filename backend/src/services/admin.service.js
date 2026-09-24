const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const Hospital = require('../models/hospital.model');
const DoctorSchedule = require('../models/doctorSchedule.model');
const WaitingList = require('../models/waitingList.model');
const Rating = require('../models/rating.model');
const AppError = require('../utils/AppError');
const { formatDate } = require('../utils/dateHelper');
const { APPOINTMENT_STATUS } = require('../constants');
const { getPagination, buildPaginationMetadata } = require('../utils/pagination');

class AdminService {
  async getDashboardStats() {
    const todayStr = formatDate(new Date());

    const [
      totalUsers,
      totalDoctors,
      totalFacilities,
      todayAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      waitingListCount,
      recentAppointments,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Doctor.countDocuments({ isActive: true }),
      Hospital.countDocuments({ isActive: true }),
      Appointment.countDocuments({ date: todayStr }),
      Appointment.countDocuments({ status: APPOINTMENT_STATUS.CONFIRMED }),
      Appointment.countDocuments({ status: APPOINTMENT_STATUS.COMPLETED }),
      Appointment.countDocuments({ status: APPOINTMENT_STATUS.CANCELLED }),
      WaitingList.countDocuments({ status: 'waiting' }),
      Appointment.find()
        .populate('doctor', 'name specialization')
        .populate('hospital', 'name city facilityType')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      totalUsers,
      totalDoctors,
      totalFacilities,
      todayAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      waitingListCount,
      recentAppointments,
    };
  }

  async getAllUsers(query = {}) {
    const filter = {};
    if (query.role) filter.role = query.role;
    if (query.isActive !== undefined && query.isActive !== '') {
      filter.isActive = query.isActive === 'true' || query.isActive === true;
    }
    if (query.search) {
      filter.$or = [
        { email: { $regex: query.search, $options: 'i' } },
        { name: { $regex: query.search, $options: 'i' } },
      ];
    }

    const { page, limit, skip } = getPagination(query.page, query.limit, 10, 50);

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      pagination: buildPaginationMetadata(total, page, limit),
    };
  }

  async getUserDetails(userId) {
    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const [upcoming, completed, cancelled] = await Promise.all([
      Appointment.find({ user: userId, status: APPOINTMENT_STATUS.CONFIRMED })
        .populate('doctor', 'name specialization')
        .populate('hospital', 'name facilityType')
        .sort({ date: 1 })
        .lean(),
      Appointment.find({ user: userId, status: APPOINTMENT_STATUS.COMPLETED })
        .populate('doctor', 'name specialization')
        .populate('hospital', 'name facilityType')
        .sort({ date: -1 })
        .lean(),
      Appointment.find({ user: userId, status: APPOINTMENT_STATUS.CANCELLED })
        .populate('doctor', 'name specialization')
        .populate('hospital', 'name facilityType')
        .sort({ date: -1 })
        .lean(),
    ]);

    return {
      user,
      appointments: {
        upcoming,
        completed,
        cancelled,
      },
    };
  }

  async toggleUserStatus(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    if (user.role === 'admin') {
      throw new AppError('Cannot toggle status of admin user.', 400);
    }
    user.isActive = !user.isActive;
    await user.save();
    return { _id: user._id, email: user.email, role: user.role, isActive: user.isActive };
  }

  async getAllAppointments(query = {}) {
    const filter = {};
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.date) {
      filter.date = query.date;
    }
    if (query.doctorId) {
      filter.doctor = query.doctorId;
    }
    if (query.hospitalId) {
      filter.hospital = query.hospitalId;
    }
    if (query.search) {
      filter.$or = [
        { 'patient.name': { $regex: query.search, $options: 'i' } },
        { 'patient.phone': { $regex: query.search, $options: 'i' } },
      ];
    }

    const { page, limit, skip } = getPagination(query.page, query.limit, 10, 50);

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('user', 'email')
        .populate('doctor', 'name specialization')
        .populate('hospital', 'name city facilityType')
        .sort({ date: -1, createdAt: -1 })
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

  async getAppointmentById(id) {
    const appointment = await Appointment.findById(id)
      .populate('user', 'email')
      .populate('doctor', 'name specialization qualification image')
      .populate('hospital', 'name address city phone facilityType')
      .populate('schedule');

    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }
    return appointment;
  }

  async getAllSchedules(query = {}) {
    const filter = {};
    if (query.doctorId) filter.doctor = query.doctorId;
    if (query.locationId) filter.location = query.locationId;
    if (query.date) filter.date = query.date;
    if (query.isAvailable !== undefined && query.isAvailable !== '') {
      filter.isAvailable = query.isAvailable === 'true' || query.isAvailable === true;
    }

    const { page, limit, skip } = getPagination(query.page, query.limit, 10, 50);

    const [schedules, total] = await Promise.all([
      DoctorSchedule.find(filter)
        .populate('doctor', 'name specialization qualification')
        .populate('location', 'name facilityType city address')
        .sort({ date: 1, startTime: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DoctorSchedule.countDocuments(filter),
    ]);

    const scheduleIds = schedules.map((s) => s._id);
    const confirmedAppointments = await Appointment.find({
      schedule: { $in: scheduleIds },
      status: APPOINTMENT_STATUS.CONFIRMED,
    }).select('schedule sessionId tokenNumber').lean();

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

    const decoratedSchedules = schedules.map((sched) => {
      const sObj = { ...sched };
      const sId = sched._id.toString();
      const bookedCount = bookedBySchedule[sId] || 0;
      sObj.bookedTokensCount = bookedCount;
      sObj.availableTokensCount = Math.max(0, (sched.totalTokens || 20) - bookedCount);

      // Normalize sessions
      if (Array.isArray(sObj.sessions) && sObj.sessions.length > 0) {
        sObj.sessions = sObj.sessions.map((sess) => {
          const sessId = (sess._id || '').toString();
          const sessBooked = bookedBySession[sessId] || 0;
          return {
            ...sess,
            bookedTokensCount: sessBooked,
            availableTokensCount: Math.max(0, (sess.totalTokens || 10) - sessBooked),
          };
        });
      } else {
        // Synthesize single session for display
        sObj.sessions = [
          {
            _id: sObj._id,
            name: 'Consultation',
            startTime: sObj.startTime || '10:00 AM',
            endTime: sObj.endTime || '01:00 PM',
            totalTokens: sObj.totalTokens || 20,
            consultationFee: sObj.consultationFee !== undefined ? sObj.consultationFee : 350,
            bookedTokensCount: bookedCount,
            availableTokensCount: Math.max(0, (sObj.totalTokens || 20) - bookedCount),
            isAvailable: sObj.isAvailable !== false,
          },
        ];
      }

      return sObj;
    });

    return {
      schedules: decoratedSchedules,
      pagination: buildPaginationMetadata(total, page, limit),
    };
  }

  async getScheduleWaitingList(scheduleId, query = {}) {
    const { page, limit, skip } = getPagination(query.page, query.limit, 10, 50);
    const filter = { schedule: scheduleId, status: 'waiting' };

    const [waitingUsers, total] = await Promise.all([
      WaitingList.find(filter).sort({ position: 1 }).skip(skip).limit(limit).lean(),
      WaitingList.countDocuments(filter),
    ]);

    return {
      waitingList: waitingUsers,
      pagination: buildPaginationMetadata(total, page, limit),
    };
  }

  async assignDoctorFacility(doctorId, facilityId) {
    const [doctor, facility] = await Promise.all([
      Doctor.findById(doctorId),
      Hospital.findById(facilityId),
    ]);

    if (!doctor) throw new AppError('Doctor not found.', 404);
    if (!facility) throw new AppError('Facility not found.', 404);

    const facIdStr = facilityId.toString();
    const alreadyAssigned = doctor.hospitals.some((h) => h.toString() === facIdStr);
    if (alreadyAssigned) {
      throw new AppError('Doctor is already assigned to this facility.', 409);
    }

    doctor.hospitals.push(facilityId);
    await doctor.save();

    return doctor.populate('hospitals', 'name facilityType city');
  }

  async removeDoctorFacility(doctorId, facilityId) {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) throw new AppError('Doctor not found.', 404);

    const facIdStr = facilityId.toString();
    doctor.hospitals = doctor.hospitals.filter((h) => h.toString() !== facIdStr);
    await doctor.save();

    return doctor.populate('hospitals', 'name facilityType city');
  }

  async getRatingsSummary(query = {}) {
    const { page, limit, skip } = getPagination(query.page, query.limit, 10, 50);

    const [doctorRatings, hospitalRatings, recentRatings, totalRatings] = await Promise.all([
      Doctor.find({ ratingCount: { $gt: 0 } })
        .select('name specialization rating ratingCount')
        .sort({ rating: -1 })
        .lean(),
      Hospital.find({ ratingCount: { $gt: 0 } })
        .select('name facilityType city rating ratingCount')
        .sort({ rating: -1 })
        .lean(),
      Rating.find()
        .populate('user', 'email')
        .populate('doctor', 'name specialization')
        .populate('hospital', 'name facilityType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Rating.countDocuments(),
    ]);

    return {
      doctorRatings,
      hospitalRatings,
      recentRatings,
      pagination: buildPaginationMetadata(totalRatings, page, limit),
    };
  }
}

module.exports = new AdminService();
