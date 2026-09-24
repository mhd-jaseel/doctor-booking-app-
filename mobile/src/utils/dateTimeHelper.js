/**
 * Client-Side Date & Time Helper Utilities
 * Evaluates session expiry and time-based booking rules consistently.
 */

/**
 * Parses a date string (YYYY-MM-DD) and a 12-hour time string (e.g. "10:00 AM" or "01:00 PM")
 * into a Date object.
 */
export const parseConsultationDateTime = (dateString, timeString) => {
  if (!dateString || !timeString) return null;

  const [year, month, day] = dateString.split('-').map(Number);
  const parts = timeString.trim().split(' ');
  const timePart = parts[0];
  const modifier = (parts[1] || 'AM').toUpperCase();

  let [hours, minutes] = timePart.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

/**
 * Checks if a session has ended relative to current time.
 * Strict boundary: currentTime >= sessionEndDateTime
 */
export const isSessionExpired = (dateString, endTimeString, now = new Date()) => {
  const sessionEnd = parseConsultationDateTime(dateString, endTimeString);
  if (!sessionEnd || isNaN(sessionEnd.getTime())) {
    return false;
  }
  return now.getTime() >= sessionEnd.getTime();
};

export const formatDate = (date) => {
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const year = d.getFullYear();
  return [year, month, day].join('-');
};

export const getTomorrowDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setDate(today.getDate() + 1);
  return formatDate(today);
};

export const getMaxScheduleDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setMonth(today.getMonth() + 2);
  return formatDate(today);
};

export const isDateWithinScheduleWindow = (dateString) => {
  if (!dateString) return false;
  const str = String(dateString).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;

  const [year, month, day] = str.split('-').map(Number);
  const target = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (isNaN(target.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 1); // Tomorrow

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 2); // 2 months from today
  maxDate.setHours(23, 59, 59, 999);

  return target >= minDate && target <= maxDate;
};

/**
 * Computes dynamic session status: 'UPCOMING' | 'ACTIVE' | 'EXPIRED'
 */
export const getSessionStatus = (dateString, startTimeString, endTimeString, now = new Date()) => {
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
