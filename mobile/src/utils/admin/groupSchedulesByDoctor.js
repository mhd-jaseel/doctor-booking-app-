/**
 * Group flat schedules array into a strict hierarchy:
 * DOCTOR -> FACILITIES -> SCHEDULES -> SESSIONS
 *
 * Guaranteed Properties:
 * 1. Top-level array contains UNIQUE doctors by `doctor._id`.
 * 2. Inside each doctor, `facilities` array contains UNIQUE facilities by `facility._id`.
 * 3. Inside each facility, `schedules` array contains all scheduled dates sorted chronologically.
 * 4. Aggregates `totalFacilities` and `totalSchedules` on the doctor level.
 *
 * @param {Array} schedules - Raw schedule list from API
 * @param {Object} filters - Search and status filters
 * @returns {Array} List of grouped doctor objects
 */
export const groupSchedulesByDoctor = (schedules = [], filters = {}) => {
  const { search = '', facilityFilter = '', statusFilter = 'ALL' } = filters;
  const searchLower = search.trim().toLowerCase();

  // 1. Filter schedule items individually
  const filtered = schedules.filter((s) => {
    const docName = s.doctor?.name || '';
    const spec = s.doctor?.specialization || '';
    const matchDoctor =
      !searchLower ||
      docName.toLowerCase().includes(searchLower) ||
      spec.toLowerCase().includes(searchLower);

    const facId = s.location?._id || s.location || '';
    const matchFacility = !facilityFilter || facId.toString() === facilityFilter.toString();

    const booked = s.bookedTokensCount || 0;
    const isFull = booked >= (s.totalTokens || 20);

    let matchStatus = true;
    if (statusFilter === 'AVAILABLE') matchStatus = s.isAvailable && !isFull;
    if (statusFilter === 'UNAVAILABLE') matchStatus = !s.isAvailable;
    if (statusFilter === 'FULL') matchStatus = s.isAvailable && isFull;

    return matchDoctor && matchFacility && matchStatus;
  });

  // 2. Map grouped by doctor._id -> Map of facility._id -> Array of schedules
  const doctorMap = new Map();

  filtered.forEach((s) => {
    const doctorObj = s.doctor;
    const docId = (doctorObj?._id || doctorObj || 'unknown_doctor').toString();

    if (!doctorMap.has(docId)) {
      doctorMap.set(docId, {
        doctor: typeof doctorObj === 'object' ? doctorObj : { _id: docId, name: 'Doctor' },
        facilityMap: new Map(),
      });
    }

    const docGroup = doctorMap.get(docId);
    const facilityObj = s.location;
    const facId = (facilityObj?._id || facilityObj || 'unknown_facility').toString();

    if (!docGroup.facilityMap.has(facId)) {
      docGroup.facilityMap.set(facId, {
        facility: typeof facilityObj === 'object' ? facilityObj : { _id: facId, name: 'Facility' },
        schedules: [],
      });
    }

    docGroup.facilityMap.get(facId).schedules.push(s);
  });

  // 3. Assemble final clean hierarchy
  const result = [];

  doctorMap.forEach((docEntry, docId) => {
    const facilities = [];
    let totalSchedules = 0;

    docEntry.facilityMap.forEach((facEntry, facId) => {
      // Sort schedules ascending by date and startTime
      facEntry.schedules.sort((a, b) => {
        const dateCmp = (a.date || '').localeCompare(b.date || '');
        if (dateCmp !== 0) return dateCmp;
        return (a.startTime || '').localeCompare(b.startTime || '');
      });

      facilities.push({
        facility: facEntry.facility,
        schedules: facEntry.schedules,
      });

      totalSchedules += facEntry.schedules.length;
    });

    // Sort facilities by name
    facilities.sort((a, b) => (a.facility?.name || '').localeCompare(b.facility?.name || ''));

    result.push({
      key: docId,
      doctor: docEntry.doctor,
      facilities,
      totalFacilities: facilities.length,
      totalSchedules,
    });
  });

  // Sort doctors alphabetically by name
  result.sort((a, b) => (a.doctor?.name || '').localeCompare(b.doctor?.name || ''));

  return result;
};
