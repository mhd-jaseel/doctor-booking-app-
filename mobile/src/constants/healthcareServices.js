/**
 * Centralized Default Healthcare Services Configuration
 * Application-level default service categories always shown on the User Home page.
 *
 * The 3 hardcoded Home categories are:
 *   1. Hospitals  – maps facilityType → hospital
 *   2. Clinics    – maps facilityType → clinic
 *   3. Others     – umbrella for ALL additional admin-managed categories
 */

export const DEFAULT_HEALTHCARE_SERVICES = [
  {
    _id: 'default_hospital',
    id: 'hospital',
    slug: 'hospitals',
    name: 'Hospitals',
    icon: 'hospital',
    facilityType: 'hospital',
    description: 'Healthcare facilities',
    color: '#2F65CB',
    bgColor: '#EBF1FF',
    borderColor: '#D4E2FF',
    displayOrder: 1,
    isActive: true,
    isDefault: true,
  },
  {
    _id: 'default_clinic',
    id: 'clinic',
    slug: 'clinics',
    name: 'Clinics',
    icon: 'clinic',
    facilityType: 'clinic',
    description: 'Medical clinics',
    color: '#0891B2',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    displayOrder: 2,
    isActive: true,
    isDefault: true,
  },
  {
    _id: 'default_others',
    id: 'others',
    slug: 'others',
    name: 'Others',
    icon: 'apps',
    facilityType: null, // no specific facilityType — shows all admin categories
    description: 'All additional healthcare categories',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    displayOrder: 3,
    isActive: true,
    isDefault: true,
    isOthers: true, // sentinel flag — tapping this opens the Others screen
  },
];

/**
 * Builds the merged list for the Home screen:
 * - Always returns exactly the 3 hardcoded cards (Hospitals, Clinics, Others).
 * - API services from Admin are stored separately in `othersServices` and shown
 *   only inside the OthersScreen, never as extra cards on the Home grid.
 *
 * @param {Array} apiServices - Active services fetched from the API
 * @returns {{ homeCards: Array, othersServices: Array }}
 */
export const buildHomeServices = (apiServices = []) => {
  if (!Array.isArray(apiServices)) {
    return { homeCards: [...DEFAULT_HEALTHCARE_SERVICES], othersServices: [] };
  }

  // Separate hospital/clinic overrides from everything else
  const hospitalOverride = apiServices.find(
    (s) => s && s.isActive !== false && ['hospitals', 'hospital'].includes((s.slug || '').toLowerCase())
  );
  const clinicOverride = apiServices.find(
    (s) => s && s.isActive !== false && ['clinics', 'clinic'].includes((s.slug || '').toLowerCase())
  );

  // All active API services that are NOT the hospital/clinic slugs → go to Others
  const CORE_SLUGS = new Set(['hospitals', 'hospital', 'clinics', 'clinic']);
  const othersServices = apiServices
    .filter((s) => s && s.isActive !== false && !CORE_SLUGS.has((s.slug || '').toLowerCase()))
    .sort((a, b) => {
      const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : 999;
      const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : 999;
      return orderA - orderB;
    });

  // Build the 3 home cards, merging API overrides when present
  const [hospitalDefault, clinicDefault, othersDefault] = DEFAULT_HEALTHCARE_SERVICES;

  const hospitalCard = hospitalOverride
    ? { ...hospitalDefault, ...hospitalOverride, icon: hospitalOverride.icon || hospitalDefault.icon, color: hospitalOverride.color || hospitalDefault.color, bgColor: hospitalOverride.bgColor || hospitalDefault.bgColor, borderColor: hospitalOverride.borderColor || hospitalDefault.borderColor, isDefault: true }
    : hospitalDefault;

  const clinicCard = clinicOverride
    ? { ...clinicDefault, ...clinicOverride, icon: clinicOverride.icon || clinicDefault.icon, color: clinicOverride.color || clinicDefault.color, bgColor: clinicOverride.bgColor || clinicDefault.bgColor, borderColor: clinicOverride.borderColor || clinicDefault.borderColor, isDefault: true }
    : clinicDefault;

  return {
    homeCards: [hospitalCard, clinicCard, othersDefault],
    othersServices,
  };
};

// Legacy export for backward-compat — returns only the 3 home cards
export const DEFAULT_OTHERS_COLOR = '#7C3AED';
export const mergeHealthcareServices = (apiServices = []) =>
  buildHomeServices(apiServices).homeCards;
