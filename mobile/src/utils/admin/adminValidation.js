import { isDateWithinScheduleWindow } from '../dateTimeHelper';

export const validateFacilityForm = (form) => {
  const errors = {};
  if (!form.name || !form.name.trim()) errors.name = 'Facility name is required.';
  if (!form.facilityType) errors.facilityType = 'Facility type is required.';
  if (!form.address || !form.address.trim()) errors.address = 'Address is required.';
  if (!form.city || !form.city.trim()) errors.city = 'City is required.';
  if (!form.phone || !form.phone.trim()) errors.phone = 'Phone number is required.';
  return Object.keys(errors).length ? errors : null;
};

export const validateDoctorForm = (form) => {
  const errors = {};
  if (!form.name || !form.name.trim()) errors.name = 'Doctor name is required.';
  if (!form.specialization || !form.specialization.trim()) errors.specialization = 'Specialization is required.';
  if (!form.qualification || !form.qualification.trim()) errors.qualification = 'Qualification is required.';
  if (isNaN(Number(form.experience)) || Number(form.experience) < 0) errors.experience = 'Experience cannot be negative.';
  if (isNaN(Number(form.consultationFee)) || Number(form.consultationFee) < 0) errors.consultationFee = 'Consultation fee cannot be negative.';
  return Object.keys(errors).length ? errors : null;
};

export const validateScheduleForm = (form) => {
  const errors = {};
  if (!form.doctor) errors.doctor = 'Doctor selection is required.';
  if (!form.location) errors.location = 'Facility selection is required.';
  if (!form.date || !isDateWithinScheduleWindow(form.date)) {
    errors.date = 'Schedule date must be between tomorrow and 2 months from today.';
  }

  const sessions = form.sessions;
  if (Array.isArray(sessions) && sessions.length > 0) {
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      if (!s.startTime || !s.startTime.trim()) {
        errors.sessions = `Start time is required for Session ${i + 1}.`;
        break;
      }
      if (!s.endTime || !s.endTime.trim()) {
        errors.sessions = `End time is required for Session ${i + 1}.`;
        break;
      }
      if (isNaN(Number(s.totalTokens)) || Number(s.totalTokens) < 1) {
        errors.sessions = `Total tokens must be at least 1 for Session ${i + 1}.`;
        break;
      }
      if (isNaN(Number(s.consultationFee)) || Number(s.consultationFee) < 0) {
        errors.sessions = `Consultation fee cannot be negative for Session ${i + 1}.`;
        break;
      }
    }
  } else {
    if (!form.startTime || !form.startTime.trim()) errors.startTime = 'Start time is required.';
    if (!form.endTime || !form.endTime.trim()) errors.endTime = 'End time is required.';
    if (isNaN(Number(form.totalTokens)) || Number(form.totalTokens) < 1) errors.totalTokens = 'Total tokens must be at least 1.';
    if (isNaN(Number(form.consultationFee)) || Number(form.consultationFee) < 0) errors.consultationFee = 'Fee cannot be negative.';
  }

  return Object.keys(errors).length ? errors : null;
};
