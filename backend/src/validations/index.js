const AppError = require('../utils/AppError');
const { isDateWithinScheduleWindow } = require('../utils/dateHelper');
const { FACILITY_TYPES } = require('../constants');

const validateRegister = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    errors.email = 'A valid email address is required.';
  }
  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Registration validation failed', 422, errors));
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    errors.email = 'A valid email address is required.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Login validation failed', 422, errors));
  }
  next();
};

const validateHospital = (req, res, next) => {
  const { name, facilityType, address, city, phone } = req.body;
  const errors = {};

  if (!name || !name.trim()) errors.name = 'Hospital/Facility name is required.';
  if (!facilityType || !Object.values(FACILITY_TYPES).includes(facilityType)) {
    errors.facilityType = `Facility type must be one of: ${Object.values(FACILITY_TYPES).join(', ')}`;
  }
  if (!address || !address.trim()) errors.address = 'Address is required.';
  if (!city || !city.trim()) errors.city = 'City is required.';
  if (!phone || !phone.trim()) errors.phone = 'Phone number is required.';

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Hospital validation failed', 422, errors));
  }
  next();
};

const validateDoctor = (req, res, next) => {
  const { name, specialization, qualification, experience, consultationFee } = req.body;
  const errors = {};

  if (!name || !name.trim()) errors.name = 'Doctor name is required.';
  if (!specialization || !specialization.trim()) errors.specialization = 'Specialization is required.';
  if (!qualification || !qualification.trim()) errors.qualification = 'Qualification is required.';
  if (experience === undefined || experience === null || isNaN(experience) || Number(experience) < 0) {
    errors.experience = 'Experience must be a non-negative number.';
  }
  if (consultationFee === undefined || consultationFee === null || isNaN(consultationFee) || Number(consultationFee) < 0) {
    errors.consultationFee = 'Consultation fee must be a non-negative number.';
  }


  if (Object.keys(errors).length > 0) {
    return next(new AppError('Doctor validation failed', 422, errors));
  }
  next();
};

const validateSchedule = (req, res, next) => {
  const { doctor, location, date, totalTokens, startTime, endTime } = req.body;
  const errors = {};

  if (!doctor) errors.doctor = 'Doctor ID is required.';
  if (!location) errors.location = 'Location/Hospital ID is required.';
  if (!date || !isDateWithinScheduleWindow(date)) {
    errors.date = 'Schedule date must be between tomorrow and 2 months from today.';
  }
  if (!totalTokens || isNaN(totalTokens) || Number(totalTokens) < 1 || Number(totalTokens) > 100) {
    errors.totalTokens = 'Total tokens must be between 1 and 100.';
  }
  if (!startTime || !startTime.trim()) errors.startTime = 'Start time is required (e.g., 09:00 AM).';
  if (!endTime || !endTime.trim()) errors.endTime = 'End time is required (e.g., 01:00 PM).';

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Schedule validation failed', 422, errors));
  }
  next();
};

const validateAppointment = (req, res, next) => {
  const { scheduleId, tokenNumber, date, patient } = req.body;
  const errors = {};

  if (!scheduleId) errors.scheduleId = 'Schedule ID is required.';
  if (!tokenNumber || isNaN(tokenNumber) || Number(tokenNumber) < 1) {
    errors.tokenNumber = 'A valid positive token number is required.';
  }
  if (!date || !isDateWithinScheduleWindow(date)) {
    errors.date = 'Booking date must be between tomorrow and 2 months from today.';
  }
  if (!patient || typeof patient !== 'object') {
    errors.patient = 'Patient details object is required.';
  } else {
    if (!patient.name || !patient.name.trim()) errors['patient.name'] = 'Patient name is required.';
    if (patient.age === undefined || isNaN(patient.age) || Number(patient.age) < 0 || Number(patient.age) > 120) {
      errors['patient.age'] = 'Valid patient age between 0 and 120 is required.';
    }
    if (!patient.gender || !['male', 'female', 'other'].includes(patient.gender.toLowerCase())) {
      errors['patient.gender'] = 'Gender must be male, female, or other.';
    }
    if (!patient.phone || !/^[0-9+\-\s]{7,15}$/.test(patient.phone.trim())) {
      errors['patient.phone'] = 'A valid patient phone number (7-15 digits) is required.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Appointment booking validation failed', 422, errors));
  }
  next();
};

const validateWaitingList = (req, res, next) => {
  const { scheduleId, patient } = req.body;
  const errors = {};

  if (!scheduleId) errors.scheduleId = 'Schedule ID is required.';
  if (!patient || typeof patient !== 'object') {
    errors.patient = 'Patient details object is required.';
  } else {
    if (!patient.name || !patient.name.trim()) errors['patient.name'] = 'Patient name is required.';
    if (patient.age === undefined || isNaN(patient.age) || Number(patient.age) < 0) {
      errors['patient.age'] = 'Valid patient age is required.';
    }
    if (!patient.gender || !['male', 'female', 'other'].includes(patient.gender.toLowerCase())) {
      errors['patient.gender'] = 'Gender must be male, female, or other.';
    }
    if (!patient.phone || !patient.phone.trim()) {
      errors['patient.phone'] = 'Patient phone number is required.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Waiting list validation failed', 422, errors));
  }
  next();
};

const validateRating = (req, res, next) => {
  const { appointmentId, doctorRating, hospitalRating } = req.body;
  const errors = {};

  if (!appointmentId) errors.appointmentId = 'Appointment ID is required.';
  if (!doctorRating || isNaN(doctorRating) || Number(doctorRating) < 1 || Number(doctorRating) > 5) {
    errors.doctorRating = 'Doctor rating must be a number between 1 and 5.';
  }
  if (!hospitalRating || isNaN(hospitalRating) || Number(hospitalRating) < 1 || Number(hospitalRating) > 5) {
    errors.hospitalRating = 'Hospital rating must be a number between 1 and 5.';
  }

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Rating validation failed', 422, errors));
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateHospital,
  validateDoctor,
  validateSchedule,
  validateAppointment,
  validateWaitingList,
  validateRating,
};
