const Hospital = require('../models/hospital.model');
const AppError = require('../utils/AppError');
const { getPagination, buildPaginationMetadata } = require('../utils/pagination');

class HospitalService {
  async getAllHospitals(query = {}) {
    const filter = {};

    // For User/Public endpoints, only active facilities are returned.
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

    if (query.facilityType && query.facilityType !== 'ALL') {
      filter.facilityType = query.facilityType;
    }
    if (query.city) {
      filter.city = { $regex: query.city, $options: 'i' };
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { city: { $regex: query.search, $options: 'i' } },
        { facilityType: { $regex: query.search, $options: 'i' } },
      ];
    }

    const { page, limit, skip } = getPagination(query.page, query.limit, 10, 50);

    const [hospitals, total] = await Promise.all([
      Hospital.find(filter)
        .sort({ rating: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Hospital.countDocuments(filter),
    ]);

    return {
      hospitals,
      pagination: buildPaginationMetadata(total, page, limit),
    };
  }

  async getHospitalById(id) {
    const hospital = await Hospital.findById(id);
    if (!hospital) {
      throw new AppError('Hospital/Facility not found.', 404);
    }
    return hospital;
  }

  async createHospital(data) {
    const hosp = await Hospital.create(data);
    return hosp;
  }

  async updateHospital(id, data) {
    const hospital = await Hospital.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!hospital) {
      throw new AppError('Hospital not found to update.', 404);
    }
    return hospital;
  }

  async toggleHospitalStatus(id, targetStatus) {
    const hospital = await Hospital.findById(id);
    if (!hospital) {
      throw new AppError('Hospital not found.', 404);
    }
    if (typeof targetStatus === 'boolean') {
      hospital.isActive = targetStatus;
    } else {
      hospital.isActive = !hospital.isActive;
    }
    await hospital.save();
    return hospital;
  }

  async deleteHospital(id) {
    const hospital = await Hospital.findById(id);
    if (!hospital) {
      throw new AppError('Hospital not found.', 404);
    }

    const Doctor = require('../models/doctor.model');
    const Appointment = require('../models/appointment.model');
    const DoctorSchedule = require('../models/doctorSchedule.model');

    const [doctorCount, appointmentCount, scheduleCount] = await Promise.all([
      Doctor.countDocuments({ hospitals: id }),
      Appointment.countDocuments({ hospital: id }),
      DoctorSchedule.countDocuments({ location: id }),
    ]);

    if (appointmentCount > 0) {
      throw new AppError(
        `Facility cannot be deleted because ${appointmentCount} appointment(s) reference this facility. Please deactivate the facility instead.`,
        400
      );
    }

    if (doctorCount > 0) {
      // Remove facility from assigned doctors
      await Doctor.updateMany({ hospitals: id }, { $pull: { hospitals: id } });
    }

    if (scheduleCount > 0) {
      await DoctorSchedule.deleteMany({ location: id });
    }

    await Hospital.findByIdAndDelete(id);
    return { success: true, message: 'Facility deleted successfully' };
  }
}

module.exports = new HospitalService();
