const { BOOKING_CONSTANTS } = require('../constants');

/**
 * Format Date to YYYY-MM-DD
 */
const formatDate = (date) => {
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const year = d.getFullYear();
  return [year, month, day].join('-');
};

/**
 * Returns tomorrow's date string (YYYY-MM-DD)
 */
const getMinScheduleDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setDate(today.getDate() + 1);
  return formatDate(today);
};

/**
 * Returns the date string (YYYY-MM-DD) 2 months from today
 */
const getMaxScheduleDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setMonth(today.getMonth() + (BOOKING_CONSTANTS.MAX_SCHEDULE_MONTHS || 2));
  return formatDate(today);
};

/**
 * Validates if the given target date (YYYY-MM-DD) falls strictly within
 * tomorrow and 2 calendar months from today (inclusive).
 * Today and past dates are completely blocked.
 */
const isDateWithinScheduleWindow = (dateString) => {
  if (!dateString) return false;
  const str = String(dateString).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;

  const [year, month, day] = str.split('-').map(Number);
  const target = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (isNaN(target.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 1);

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + (BOOKING_CONSTANTS.MAX_SCHEDULE_MONTHS || 2));
  maxDate.setHours(23, 59, 59, 999);

  return target >= minDate && target <= maxDate;
};

/**
 * Parses a date string (YYYY-MM-DD) and a 12-hour start time string (e.g. "10:00 AM")
 * into a local Date object.
 */
const parseConsultationStartTime = (dateString, startTimeString) => {
  if (!dateString || !startTimeString) return null;

  const [year, month, day] = dateString.split('-').map(Number);
  
  const str = String(startTimeString).trim().toUpperCase();
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  let minutes = Number(match[2]);
  const modifier = match[3] || 'AM';

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return date;
};

/**
 * Validates whether cancellation is allowed for a given consultation date & start time.
 * Cancellation is allowed STRICTLY BEFORE 1 hour prior to consultation start time:
 * currentTime < consultationStartTime - 1 hour.
 */
const isCancellationAllowed = (dateString, startTimeString, now = new Date()) => {
  const consultationStart = parseConsultationStartTime(dateString, startTimeString);
  if (!consultationStart || isNaN(consultationStart.getTime())) {
    return false;
  }

  // Cancellation deadline = consultationStartTime - 1 hour (in ms: 60 * 60 * 1000)
  const cancellationDeadline = new Date(consultationStart.getTime() - 60 * 60 * 1000);

  return now.getTime() < cancellationDeadline.getTime();
};

/**
 * Converts a 12-hour time string (e.g., "10:00 AM") to total minutes from midnight.
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr) return -1;
  const str = String(timeStr).trim().toUpperCase();
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  
  if (!match) return -1;

  let hours = Number(match[1]);
  let minutes = Number(match[2]);
  const modifier = match[3] || 'AM';

  if (isNaN(hours) || isNaN(minutes)) return -1;
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

/**
 * Checks if two time windows [startA, endA] and [startB, endB] overlap.
 */
const isTimeOverlapping = (startAStr, endAStr, startBStr, endBStr) => {
  const startA = timeToMinutes(startAStr);
  const endA = timeToMinutes(endAStr);
  const startB = timeToMinutes(startBStr);
  const endB = timeToMinutes(endBStr);

  if (startA < 0 || endA < 0 || startB < 0 || endB < 0) return false;
  return Math.max(startA, startB) < Math.min(endA, endB);
};

/**
 * Parses a date string (YYYY-MM-DD) and a 12-hour time string (e.g. "10:00 AM" or "01:00 PM")
 * into a local Date object.
 */
const parseConsultationDateTime = (dateString, timeString) => {
  if (!dateString || !timeString) return null;

  const [year, month, day] = dateString.split('-').map(Number);
  
  const str = String(timeString).trim().toUpperCase();
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  let minutes = Number(match[2]);
  const modifier = match[3] || 'AM';

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return date;
};

/**
 * Checks if a consultation session has ended.
 * Strict boundary: currentTime >= sessionEndDateTime
 */
const isSessionExpired = (dateString, endTimeString, now = new Date()) => {
  const sessionEnd = parseConsultationDateTime(dateString, endTimeString);
  if (!sessionEnd || isNaN(sessionEnd.getTime())) {
    return false;
  }
  return now.getTime() >= sessionEnd.getTime();
};

/**
 * Returns dynamic session time status: 'UPCOMING' | 'ACTIVE' | 'EXPIRED'
 */
const getSessionStatus = (dateString, startTimeString, endTimeString, now = new Date()) => {
  const sessionStart = parseConsultationDateTime(dateString, startTimeString);
  const sessionEnd = parseConsultationDateTime(dateString, endTimeString);

  if (!sessionStart || !sessionEnd || isNaN(sessionStart.getTime()) || isNaN(sessionEnd.getTime())) {
    return 'UNKNOWN';
  }

  const currentMs = now.getTime();
  if (currentMs >= sessionEnd.getTime()) {
    return 'EXPIRED';
  }
  if (currentMs >= sessionStart.getTime()) {
    return 'ACTIVE';
  }
  return 'UPCOMING';
};

module.exports = {
  isDateWithinScheduleWindow,
  getMinScheduleDate,
  getMaxScheduleDate,
  formatDate,
  parseConsultationStartTime,
  parseConsultationDateTime,
  isSessionExpired,
  getSessionStatus,
  isCancellationAllowed,
  timeToMinutes,
  isTimeOverlapping,
};
