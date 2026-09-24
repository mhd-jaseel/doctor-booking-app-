const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/user.model');
const Hospital = require('../models/hospital.model');
const Doctor = require('../models/doctor.model');
const DoctorSchedule = require('../models/doctorSchedule.model');
const Appointment = require('../models/appointment.model');
const WaitingList = require('../models/waitingList.model');
const Notification = require('../models/notification.model');
const appointmentService = require('../services/appointment.service');
const waitingListService = require('../services/waitingList.service');
const scheduleService = require('../services/schedule.service');
const adminService = require('../services/admin.service');
const hospitalService = require('../services/hospital.service');
const doctorService = require('../services/doctor.service');
const notificationService = require('../services/notification.service');
const authService = require('../services/auth.service');

const { formatDate } = require('./dateHelper');
const { ROLES, FACILITY_TYPES } = require('../constants');

const runTests = async () => {
  console.log('====================================================');
  console.log('  RUNNING DOCTOR BOOKING INTEGRATION & ADMIN TEST SUITE');
  console.log('====================================================\n');

  await mongoose.connect(env.MONGO_URI);

  try {
    // 0. Setup isolated test fixtures
    let admin = await User.findOne({ email: (env.ADMIN_EMAIL || 'admin@doctorbooking.com').toLowerCase() });
    if (!admin) {
      admin = await User.create({
        name: 'System Administrator',
        email: (env.ADMIN_EMAIL || 'admin@doctorbooking.com').toLowerCase(),
        password: env.ADMIN_PASSWORD || 'Admin@12345',
        role: ROLES.ADMIN,
        isActive: true,
      });
    }

    let user1 = await User.findOne({ email: 'user@example.com' });
    if (!user1) {
      user1 = await User.create({
        name: 'Mohammed Jaseel',
        email: 'user@example.com',
        password: 'userpassword123',
        role: ROLES.USER,
        isActive: true,
      });
    }

    let user2 = await User.findOne({ email: 'john.doe@example.com' });
    if (!user2) {
      user2 = await User.create({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: ROLES.USER,
        isActive: true,
      });
    }

    let testHospital = await Hospital.findOne({ name: 'City Care Hospital' });
    if (!testHospital) {
      testHospital = await Hospital.create({
        name: 'City Care Hospital',
        facilityType: FACILITY_TYPES.HOSPITAL,
        address: 'Main Road',
        city: 'Kuttippuram',
        phone: '+91 494 2608222',
        rating: 0,
        ratingCount: 0,
      });
    }

    let doctor = await Doctor.findOne({ name: 'Dr. FATHIMA FAIROOSA K' });
    if (!doctor) {
      doctor = await Doctor.create({
        name: 'Dr. FATHIMA FAIROOSA K',
        specialization: 'GENERAL MEDICINE',
        qualification: 'MBBS',
        experience: 8,
        gender: 'female',
        consultationFee: 300,
        hospitals: [testHospital._id],
        isActive: true,
      });
    }

    // Ensure 5 consecutive days of schedules for doctor
    const today = new Date();
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + dayOffset);
      const dateStr = formatDate(d);

      const existingSched = await DoctorSchedule.findOne({ doctor: doctor._id, date: dateStr });
      if (!existingSched) {
        await DoctorSchedule.create({
          doctor: doctor._id,
          location: testHospital._id,
          date: dateStr,
          totalTokens: 10,
          startTime: '10:00 AM',
          endTime: '08:00 PM',
          consultationFee: 300,
          isAvailable: true,
        });
      }
    }

    // Ensure test collections start clean for tests
    await Promise.all([
      Appointment.deleteMany({}),
      WaitingList.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    // Reset booked tokens on test schedules
    await DoctorSchedule.updateMany({ doctor: doctor._id }, { $set: { bookedTokens: [] } });

    const schedules = await scheduleService.getDoctorSchedules(doctor._id);
    const targetSchedule = schedules[0];

    console.log(`[TEST 1] Testing schedule window for Dr. ${doctor.name}...`);
    console.log(`Found ${schedules.length} schedules. Target date: ${targetSchedule ? targetSchedule.date : 'N/A'}`);
    if (schedules.length > 0) {
      console.log('✅ TEST 1 PASSED: Valid schedules retrieved within 2-month schedule window.\n');
    } else {
      throw new Error(`Expected at least 1 schedule, got ${schedules.length}`);
    }

    console.log('[TEST 2] Testing Race-Condition Protection (Simultaneous Booking of Token #3)...');
    const bookingPayload1 = {
      scheduleId: targetSchedule._id,
      tokenNumber: 3,
      date: targetSchedule.date,
      patient: { name: 'Patient A', age: 30, gender: 'male', phone: '+91 99999 11111' },
    };
    const bookingPayload2 = {
      scheduleId: targetSchedule._id,
      tokenNumber: 3,
      date: targetSchedule.date,
      patient: { name: 'Patient B', age: 25, gender: 'female', phone: '+91 99999 22222' },
    };

    // Execute concurrent booking promises
    const [res1, res2] = await Promise.allSettled([
      appointmentService.bookAppointment(user1._id, bookingPayload1),
      appointmentService.bookAppointment(user2._id, bookingPayload2),
    ]);

    const successes = [res1, res2].filter((r) => r.status === 'fulfilled');
    const failures = [res1, res2].filter((r) => r.status === 'rejected');

    const winnerUser = res1.status === 'fulfilled' ? user1 : user2;
    const winnerPhone = res1.status === 'fulfilled' ? '+91 99999 11111' : '+91 99999 22222';

    if (successes.length === 1 && failures.length === 1) {
      console.log('✅ TEST 2 PASSED: Only 1 user successfully booked Token #3.');
      console.log(`   Failed reason: "${failures[0].reason.message}" (Status: ${failures[0].reason.statusCode})\n`);
    } else {
      throw new Error(`Race condition test failed! Successes: ${successes.length}, Failures: ${failures.length}`);
    }

    console.log('[TEST 3] Testing Duplicate Patient Booking Rule on Same Doctor & Date...');
    const winningAppointment = await Appointment.findOne({ schedule: targetSchedule._id, tokenNumber: 3, status: 'confirmed' });
    try {
      await appointmentService.bookAppointment(winningAppointment.user, {
        scheduleId: targetSchedule._id,
        tokenNumber: 4,
        date: targetSchedule.date,
        patient: {
          name: winningAppointment.patient.name,
          age: winningAppointment.patient.age,
          gender: winningAppointment.patient.gender,
          phone: winningAppointment.patient.phone,
        },
      });
      throw new Error('Duplicate booking should have been prevented!');
    } catch (err) {
      if (err.statusCode === 409) {
        console.log(`✅ TEST 3 PASSED: Duplicate patient blocked with 409: "${err.message}"\n`);
      } else {
        throw err;
      }
    }

    console.log('[TEST 4] Testing Cancellation, Queue Compaction and Waiting List Promotion...');
    const cancelTestSchedule = schedules[1];
    const updatedSched = await scheduleService.getScheduleById(cancelTestSchedule._id);
    const existingBooked = (updatedSched.bookedTokens || (updatedSched.slots || []).filter(s => s.isBooked).map(s => s.tokenNumber)) || [];
    const targetSession = (updatedSched.sessions && updatedSched.sessions[0]) || null;
    const sessionTotal = targetSession ? targetSession.totalTokens : cancelTestSchedule.totalTokens;

    for (let t = 1; t <= sessionTotal; t++) {
      if (!existingBooked.includes(t)) {
        await Appointment.create({
          user: user2._id,
          doctor: cancelTestSchedule.doctor._id,
          hospital: cancelTestSchedule.location._id,
          schedule: cancelTestSchedule._id,
          sessionId: targetSession ? targetSession._id : null,
          sessionName: targetSession ? targetSession.name : 'Consultation',
          tokenNumber: t,
          date: cancelTestSchedule.date,
          consultationFee: targetSession ? targetSession.consultationFee : (cancelTestSchedule.consultationFee || 300),
          patient: { name: `Dummy Patient ${t}`, age: 20 + t, gender: 'male', phone: `+91 91000 000${t < 10 ? '0' + t : t}` },
          status: 'confirmed',
        });
      }
    }

    const waitEntry = await waitingListService.joinWaitingList(user1._id, {
      scheduleId: cancelTestSchedule._id,
      sessionId: targetSession ? targetSession._id : undefined,
      patient: { name: 'Waiting Patient Sarah', age: 28, gender: 'female', phone: '+91 98888 77777' },
    });
    console.log(`User 1 joined waiting list at position #${waitEntry.position}`);

    const activeApp = await Appointment.findOne({
      schedule: cancelTestSchedule._id,
      user: user2._id,
      status: 'confirmed',
      tokenNumber: 1,
    });
    const cancelledToken = activeApp.tokenNumber;

    console.log(`Admin cancelling appointment with Token #${cancelledToken}...`);
    await appointmentService.cancelAppointment(activeApp._id, admin._id, true);

    // Verify waiting list user promoted to the LAST token (cancelTestSchedule.totalTokens)
    const promotedApp = await Appointment.findOne({
      schedule: cancelTestSchedule._id,
      user: user1._id,
      tokenNumber: cancelTestSchedule.totalTokens,
      status: 'confirmed',
    });

    if (promotedApp) {
      console.log(`✅ TEST 4 PASSED: Waiting list user automatically promoted with the LAST Token #${cancelTestSchedule.totalTokens}.\n`);
    } else {
      throw new Error(`Waiting list promotion failed! Expected token #${cancelTestSchedule.totalTokens}`);
    }

    console.log('[TEST 5] Testing Admin Doctor Unavailable Cascade & Patient Notifications...');
    let otherHospital = await Hospital.findOne({ name: 'Metro Medical College & Hospital' });
    if (!otherHospital) {
      otherHospital = await Hospital.create({
        name: 'Metro Medical College & Hospital',
        facilityType: FACILITY_TYPES.MEDICAL_COLLEGE,
        address: 'Bypass Road',
        city: 'Kuttippuram',
        phone: '+91 494 2609999',
        rating: 0,
        ratingCount: 0,
      });
    }
    if (!doctor.hospitals.some((h) => h.toString() === otherHospital._id.toString())) {
      doctor.hospitals.push(otherHospital._id);
      await doctor.save();
    }

    await DoctorSchedule.deleteMany({ doctor: doctor._id, location: otherHospital._id });
    const testSched = await scheduleService.createSchedule({
      doctor: doctor._id,
      location: otherHospital._id,
      date: schedules[1].date,
      startTime: '08:30 PM',
      endTime: '10:00 PM',
      totalTokens: 10,
      consultationFee: 450,
      isAvailable: true,
    });

    // Book an appointment on this test schedule
    const testApp = await appointmentService.bookAppointment(user1._id, {
      scheduleId: testSched._id,
      tokenNumber: 1,
      date: testSched.date,
      patient: { name: 'Test Unavailability Patient', age: 35, gender: 'male', phone: '+91 97777 66666' },
    });

    // Mark schedule unavailable
    await scheduleService.toggleScheduleAvailability(testSched._id);

    // Verify appointment was marked cancelled and notification was created
    const cancelledTestApp = await Appointment.findById(testApp._id);
    const notification = await Notification.findOne({ appointment: testApp._id });

    if (cancelledTestApp.status === 'cancelled' && notification) {
      console.log(`✅ TEST 5 PASSED: Schedule unavailability cancelled appointment and created notification.\n`);
    } else {
      throw new Error('Doctor unavailability cascade test failed!');
    }

    console.log('[TEST 6] Testing Admin Environment Auth, Wrong Password, and Role Verification...');
    const authService = require('../services/auth.service');

    // 1. Valid Admin Login
    const validLogin = await authService.login({
      email: env.ADMIN_EMAIL || 'admin@doctorbooking.com',
      password: env.ADMIN_PASSWORD || 'Admin@12345',
    });
    if (!validLogin.token || validLogin.user.role !== 'admin') {
      throw new Error('Admin valid login failed to return admin role or token!');
    }

    // 2. Wrong Password Check -> 401
    try {
      await authService.login({
        email: env.ADMIN_EMAIL || 'admin@doctorbooking.com',
        password: 'wrong_admin_password',
      });
      throw new Error('Admin login with wrong password should have thrown 401!');
    } catch (err) {
      if (err.statusCode !== 401) throw err;
    }

    // 3. Normal User Role Guard Check -> user cannot have role admin
    const normalLogin = await authService.login({
      email: 'user@example.com',
      password: 'userpassword123',
    });
    if (normalLogin.user.role === 'admin') {
      throw new Error('Normal user should not have admin role!');
    }

    console.log('✅ TEST 6 PASSED: Admin env auth, wrong password 401, and role guard verified.\n');

    console.log('[TEST 7] Testing Server-Side Pagination and Metadata Contract across Services...');
    // 1. Hospital Pagination
    const hospPage1 = await hospitalService.getAllHospitals({ page: 1, limit: 2 });
    if (!hospPage1.pagination || hospPage1.pagination.currentPage !== 1 || hospPage1.pagination.limit !== 2 || hospPage1.hospitals.length > 2) {
      throw new Error('Hospital pagination failed contract verification!');
    }
    if (typeof hospPage1.pagination.totalItems !== 'number' || typeof hospPage1.pagination.totalPages !== 'number') {
      throw new Error('Hospital pagination missing totalItems/totalPages!');
    }

    // 2. Doctor Pagination
    const docPage1 = await doctorService.getAllDoctors({ page: 1, limit: 2 });
    if (!docPage1.pagination || docPage1.pagination.currentPage !== 1 || docPage1.pagination.limit !== 2) {
      throw new Error('Doctor pagination failed contract verification!');
    }

    // 3. Admin Users Pagination
    const adminUsersPage = await adminService.getAllUsers({ page: 1, limit: 2 });
    if (!adminUsersPage.pagination || adminUsersPage.pagination.currentPage !== 1) {
      throw new Error('Admin users pagination failed contract verification!');
    }

    // 4. Admin Appointments Pagination
    const adminApptsPage = await adminService.getAllAppointments({ page: 1, limit: 2 });
    if (!adminApptsPage.pagination || adminApptsPage.pagination.currentPage !== 1) {
      throw new Error('Admin appointments pagination failed contract verification!');
    }

    // 5. Admin Schedules Pagination
    const adminSchedPage = await adminService.getAllSchedules({ page: 1, limit: 2 });
    if (!adminSchedPage.pagination || adminSchedPage.pagination.currentPage !== 1) {
      throw new Error('Admin schedules pagination failed contract verification!');
    }

    console.log(`✅ TEST 7 PASSED: Server-side pagination verified for Hospitals (Total: ${hospPage1.pagination.totalItems}), Doctors (Total: ${docPage1.pagination.totalItems}), Admin Users, Appointments, and Schedules.\n`);

    console.log('[TEST 8] Testing MongoDB GridFS Persistent Image Storage & Retrieval...');
    const fileStorageService = require('../services/fileStorage.service');
    const mockImageBuffer = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');
    const mockFile = {
      buffer: mockImageBuffer,
      originalname: 'doctor_avatar.png',
      mimetype: 'image/png',
      size: mockImageBuffer.length,
    };

    // 1. Upload mock file to GridFS
    const uploadResult = await fileStorageService.uploadFile(mockFile, { doctor: doctor._id });
    if (!uploadResult.fileId || uploadResult.contentType !== 'image/png') {
      throw new Error('GridFS upload failed to return valid fileId or contentType!');
    }
    console.log(`   Uploaded file to GridFS with ID: ${uploadResult.fileId}`);

    // 2. Retrieve file stream from GridFS
    const { stream, file: retrievedFile } = await fileStorageService.getFileStream(uploadResult.fileId);
    if (!retrievedFile || retrievedFile.contentType !== 'image/png' || retrievedFile.length !== mockImageBuffer.length) {
      throw new Error('GridFS retrieved file metadata mismatch!');
    }

    // 3. Delete file from GridFS
    const deleted = await fileStorageService.deleteFile(uploadResult.fileId);
    if (!deleted) {
      throw new Error('GridFS delete file failed!');
    }

    // 4. Verify file no longer exists
    try {
      await fileStorageService.getFileStream(uploadResult.fileId);
      throw new Error('File should not exist after deletion!');
    } catch (err) {
      if (err.statusCode !== 404) throw err;
    }

    console.log('[TEST 9] Testing Strict Consultation Session End Time Expiry & Booking Rejection...');
    const todayDateStr = formatDate(new Date());
    await DoctorSchedule.deleteMany({ doctor: doctor._id, location: otherHospital._id, date: todayDateStr });

    // Create an already-expired session for today with a past end time (e.g. 06:00 AM - 07:00 AM)
    const expiredSchedule = await scheduleService.createSchedule({
      doctor: doctor._id,
      location: otherHospital._id,
      date: todayDateStr,
      sessions: [
        {
          name: 'Early Morning Past',
          startTime: '06:00 AM',
          endTime: '07:00 AM',
          totalTokens: 5,
          consultationFee: 250,
        },
      ],
    });

    try {
      // Attempt booking on expired session
      await appointmentService.bookAppointment(user1._id, {
        scheduleId: expiredSchedule._id,
        sessionId: expiredSchedule.sessions[0]._id,
        tokenNumber: 1,
        date: expiredSchedule.date,
        patient: { name: 'Late Patient', age: 40, gender: 'male', phone: '+91 95555 44444' },
      });
      throw new Error('Booking on expired session should have been rejected with 409!');
    } catch (err) {
      if (err.statusCode === 409 && err.message.includes('ended')) {
        console.log(`✅ TEST 9 PASSED: Expired session booking blocked with 409: "${err.message}"\n`);
      } else {
        throw err;
      }
    } finally {
      await DoctorSchedule.findByIdAndDelete(expiredSchedule._id);
    }

    console.log('[TEST 10] Testing Auto-Sync Version Tracking & Change Detection...');
        const initialVersion = await syncService.getCurrentVersion();
    console.log(`Initial global data version: ${initialVersion}`);

    // Create a new doctor and verify version increments and changes are tracked
    const testSyncDoctor = await doctorService.createDoctor({
      name: 'Dr. Sync Test',
      email: 'dr.sync@test.com',
      specialization: 'CARDIOLOGY',
      qualification: 'MBBS, MD',
      experience: 7,
      consultationFee: 400,
    });

    const newVersion = await syncService.getCurrentVersion();
    if (newVersion <= initialVersion) {
      throw new Error(`Expected new version > initialVersion, got ${newVersion} <= ${initialVersion}`);
    }

    const changeReport = await syncService.getChangesSince(initialVersion);
    if (!changeReport.changes.includes('doctors')) {
      throw new Error(`Expected changes to include 'doctors', got: ${JSON.stringify(changeReport.changes)}`);
    }

    console.log(`✅ TEST 10 PASSED: Version advanced ${initialVersion} -> ${newVersion}, changes detected: [${changeReport.changes.join(', ')}]\n`);

    // Clean up test doctor
    await Doctor.findByIdAndDelete(testSyncDoctor._id);

    console.log('====================================================');
    console.log('  ALL INTEGRATION, CONCURRENCY & ADMIN TESTS PASSED! 🎉');
    console.log('====================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test Suite Failed:', error);
    process.exit(1);
  }
};

runTests();
