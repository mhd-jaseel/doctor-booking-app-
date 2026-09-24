import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  // If EXPO_PUBLIC_API_URL is defined, prioritize it
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Production Render Backend API URL
  return 'https://doctor-booking-api-2za8.onrender.com/api';
};

export const API_BASE_URL = getApiBaseUrl();


export const SPECIALIZATION_TAGS = [
  'ALL',
  'GENERAL MEDICINE',
  'PEDIATRICS',
  'CARDIOLOGY',
  'DERMATOLOGY',
  'NEUROLOGY',
];

export const HEALTHCARE_SERVICES = [
  {
    id: 'hospital',
    label: 'Hospitals',
    sublabel: 'General & Multi-Speciality',
    facilityType: 'hospital',
    icon: 'business',
    color: '#0284C7',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  {
    id: 'clinic',
    label: 'Clinics',
    sublabel: 'Family & Dental Clinics',
    facilityType: 'clinic',
    icon: 'medkit',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  {
    id: 'medical_college',
    label: 'Medical Colleges',
    sublabel: 'Teaching Hospitals',
    facilityType: 'medical_college',
    icon: 'school',
    color: '#2F65CB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  {
    id: 'speciality_centre',
    label: 'Speciality Centres',
    sublabel: 'Cardiology, Eye & Ortho',
    facilityType: 'speciality_centre',
    icon: 'heart',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  {
    id: 'polyclinic',
    label: 'Polyclinics',
    sublabel: 'Multi-Specialist OPDs',
    facilityType: 'polyclinic',
    icon: 'people',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  {
    id: 'diagnostic_centre',
    label: 'Diagnostic Centres',
    sublabel: 'Labs & Radiology',
    facilityType: 'diagnostic_centre',
    icon: 'flask',
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  {
    id: 'health_centre',
    label: 'Health Centres',
    sublabel: 'Community Care',
    facilityType: 'health_centre',
    icon: 'fitness',
    color: '#0D9488',
    bgColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
];
