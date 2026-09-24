const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

const FACILITY_TYPES = {
  HOSPITAL: 'hospital',
  CLINIC: 'clinic',
  MEDICAL_COLLEGE: 'medical_college',
  SPECIALITY_CENTRE: 'speciality_centre',
  POLYCLINIC: 'polyclinic',
  DIAGNOSTIC_CENTRE: 'diagnostic_centre',
  HEALTH_CENTRE: 'health_centre',
};



const APPOINTMENT_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

const WAITING_LIST_STATUS = {
  WAITING: 'waiting',
  PROMOTED: 'promoted',
  CANCELLED: 'cancelled',
};

const NOTIFICATION_TYPES = {
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  WAITING_LIST_PROMOTED: 'waiting_list_promoted',
  TOKEN_CHANGED: 'token_changed',
};

const BOOKING_CONSTANTS = {
  MAX_SCHEDULE_MONTHS: 2,
  MAX_WAITING_LIST: 5,
};

module.exports = {
  ROLES,
  FACILITY_TYPES,
  APPOINTMENT_STATUS,
  WAITING_LIST_STATUS,
  NOTIFICATION_TYPES,
  BOOKING_CONSTANTS,
};
