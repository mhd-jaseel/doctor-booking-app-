const mongoose = require('mongoose');
const Rating = require('../models/rating.model');
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const Hospital = require('../models/hospital.model');
const AppError = require('../utils/AppError');
const { APPOINTMENT_STATUS } = require('../constants');

class RatingService {
  async submitRating(userId, { appointmentId, doctorRating, hospitalRating }) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    if (appointment.user.toString() !== userId.toString()) {
      throw new AppError('You can only rate your own appointments.', 403);
    }

    // Only completed appointments can be rated
    if (appointment.status !== APPOINTMENT_STATUS.COMPLETED) {
      throw new AppError('Only completed appointments can be rated.', 400);
    }

    // Check if already rated
    const existing = await Rating.findOne({ user: userId, appointment: appointmentId });
    if (existing) {
      throw new AppError('You have already submitted a rating for this appointment.', 409);
    }

    const rating = await Rating.create({
      user: userId,
      appointment: appointmentId,
      doctor: appointment.doctor,
      hospital: appointment.hospital,
      doctorRating,
      hospitalRating,
    });

    // Recalculate average doctor rating
    const doctorRatings = await Rating.find({ doctor: appointment.doctor });
    const doctorAvg =
      doctorRatings.reduce((sum, r) => sum + r.doctorRating, 0) / (doctorRatings.length || 1);
    await Doctor.findByIdAndUpdate(appointment.doctor, {
      rating: parseFloat(doctorAvg.toFixed(1)),
      ratingCount: doctorRatings.length,
    });

    // Recalculate average hospital rating
    const hospitalRatings = await Rating.find({ hospital: appointment.hospital });
    const hospitalAvg =
      hospitalRatings.reduce((sum, r) => sum + r.hospitalRating, 0) / (hospitalRatings.length || 1);
    await Hospital.findByIdAndUpdate(appointment.hospital, {
      rating: parseFloat(hospitalAvg.toFixed(1)),
      ratingCount: hospitalRatings.length,
    });

    return rating;
  }
}

module.exports = new RatingService();
