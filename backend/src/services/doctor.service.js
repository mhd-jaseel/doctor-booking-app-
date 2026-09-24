const Doctor = require('../models/doctor.model');
const DoctorSchedule = require('../models/doctorSchedule.model');
const Appointment = require('../models/appointment.model');
const WaitingList = require('../models/waitingList.model');
const Rating = require('../models/rating.model');
const AppError = require('../utils/AppError');
const doctorAvailabilityService = require('./doctorAvailability.service');
const { getPagination, buildPaginationMetadata } = require('../utils/pagination');

class DoctorService {
  async getAllDoctors(query = {}) {
    const filter = {};

    // For User/Public endpoints, only active doctors are returned.
    // For Admin requests (query.isAdmin or query.status), filter accordingly.
    if (query.isAdmin || query.status) {
      if (query.status === 'active' || query.isActive === 'true' || query.isActive === true) {
        filter.isActive = true;
      } else if (query.status === 'inactive' || query.isActive === 'false' || query.isActive === false) {
        filter.isActive = false;
      }
      // If status === 'all' or no specific status, return BOTH active and inactive
    } else {
      // Default for user / public browsing: ACTIVE ONLY
      filter.isActive = true;
    }

    if (query.specialization && query.specialization.toUpperCase() !== 'ALL') {
      filter.specialization = { $regex: new RegExp(`^${query.specialization}$`, 'i') };
    }

    if (query.hospitalId) {
      filter.hospitals = query.hospitalId;
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { specialization: { $regex: query.search, $options: 'i' } },
        { qualification: { $regex: query.search, $options: 'i' } },
      ];
    }

    const { page, limit, skip } = getPagination(query.page, query.limit, 10, 50);

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .populate('hospitals', 'name facilityType city address')
        .sort({ rating: -1, experience: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Doctor.countDocuments(filter),
    ]);

    // Attach today's availability using single source of truth service
    const doctorIds = doctors.map((d) => d._id);
    const availabilityMap = await doctorAvailabilityService.getTodayAvailabilityMap(doctorIds);

    const decoratedDoctors = doctors.map((doc) => {
      const dObj = { ...doc };
      const avail = availabilityMap[doc._id.toString()];
      if (doc.isActive && avail && avail.isAvailable) {
        dObj.todayAvailability = avail;
      } else {
        dObj.todayAvailability = {
          isAvailable: false,
          availableSlots: 0,
        };
      }
      return dObj;
    });

    return {
      doctors: decoratedDoctors,
      pagination: buildPaginationMetadata(total, page, limit),
    };
  }

  async getDoctorById(id) {
    const doctor = await Doctor.findById(id).populate(
      'hospitals',
      'name facilityType city address phone workingHours'
    );
    if (!doctor) {
      throw new AppError('Doctor not found.', 404);
    }

    const todayAvailability = doctor.isActive
      ? await doctorAvailabilityService.getDoctorTodayAvailability(doctor._id)
      : { isAvailable: false, availableSlots: 0 };

    const docObj = doctor.toObject ? doctor.toObject() : { ...doctor };
    docObj.todayAvailability = todayAvailability;
    return docObj;
  }

  async getDoctorsByHospital(hospitalId, query = {}) {
    const { page, limit, skip } = getPagination(query.page, query.limit, 10, 50);
    const filter = { hospitals: hospitalId, isActive: true };

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .sort({ rating: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Doctor.countDocuments(filter),
    ]);

    const doctorIds = doctors.map((d) => d._id);
    const availabilityMap = await doctorAvailabilityService.getTodayAvailabilityMap(doctorIds);

    const decoratedDoctors = doctors.map((doc) => ({
      ...doc,
      todayAvailability: availabilityMap[doc._id.toString()] || { isAvailable: false, availableSlots: 0 },
    }));

    return {
      doctors: decoratedDoctors,
      pagination: buildPaginationMetadata(total, page, limit),
    };
  }

  async createDoctor(data) {
    const doc = await Doctor.create(data);
    return doc;
  }

  async updateDoctor(id, data) {
    const doctor = await Doctor.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!doctor) {
      throw new AppError('Doctor not found to update.', 404);
    }
    return doctor;
  }

  async toggleDoctorStatus(id, targetStatus) {
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      throw new AppError('Doctor not found.', 404);
    }
    if (typeof targetStatus === 'boolean') {
      doctor.isActive = targetStatus;
    } else {
      doctor.isActive = !doctor.isActive;
    }
    await doctor.save();
    return doctor;
  }

  async deleteDoctor(id) {
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      throw new AppError('Doctor not found.', 404);
    }

    // Reference Integrity Guard:
    // Check whether doctor has any appointments, waiting list entries, or active schedules
    const [appointmentCount, waitingListCount, scheduleCount] = await Promise.all([
      Appointment.countDocuments({ doctor: id }),
      WaitingList.countDocuments({ doctor: id }),
      DoctorSchedule.countDocuments({ doctor: id }),
    ]);

    if (appointmentCount > 0 || waitingListCount > 0) {
      throw new AppError(
        `Doctor cannot be permanently deleted because ${appointmentCount} appointment(s) and ${waitingListCount} waiting list record(s) reference this doctor. Please deactivate the doctor instead.`,
        400
      );
    }

    // If schedules exist without appointments, safely clean up those orphan schedules
    if (scheduleCount > 0) {
      await DoctorSchedule.deleteMany({ doctor: id });
    }

    // Clean up any ratings
    await Rating.deleteMany({ doctor: id });

    // Remove doctor document
    await Doctor.findByIdAndDelete(id);

    return { success: true, message: 'Doctor deleted successfully' };
  }
}

module.exports = new DoctorService();
