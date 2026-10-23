const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Patient = require('./models/Patient');
const TemperatureRecord = require('./models/TemperatureRecord');
const DoctorVisit = require('./models/DoctorVisit');
const FacilityConfig = require('./models/FacilityConfig');
const AuditLog = require('./models/AuditLog');
const { getTodayDateString, addDays } = require('./utils/dateUtils');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/viruscare';
    await mongoose.connect(mongoUri);
    console.log(`[Seed] Connected to MongoDB at ${mongoUri}`);

    // Clear existing collections for a clean, deterministic demo state
    await User.deleteMany({});
    await Patient.deleteMany({});
    await TemperatureRecord.deleteMany({});
    await DoctorVisit.deleteMany({});
    await FacilityConfig.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('[Seed] Cleared existing data.');

    // 1. Create Facility Config
    const config = await FacilityConfig.create({
      key: 'facility_settings',
      facilityName: 'VirusCare Quarantine & Treatment Facility',
      maxCapacity: 74,
      feverThreshold: 38.0,
    });
    console.log('[Seed] Created default facility config (Max Capacity: 74, Fever Threshold: 38.0°C)');

    // 2. Create Users for all 3 roles (pass plain text; User model pre('save') hook hashes automatically)
    const admin = await User.create({
      name: 'Pooja Sharma (Admin)',
      email: 'admin@viruscare.org',
      password: 'admin123',
      role: 'admin',
    });

    const doctor = await User.create({
      name: 'Dr. Rajesh Kulkarni (Doctor)',
      email: 'doctor@viruscare.org',
      password: 'doctor123',
      role: 'doctor',
    });

    const nurse = await User.create({
      name: 'Nurse Anjali Nair (Nurse)',
      email: 'nurse@viruscare.org',
      password: 'nurse123',
      role: 'nurse',
    });

    console.log('[Seed] Created demo users (Admin, Doctor, Nurse)');

    // Relative dates based on today
    const today = getTodayDateString();
    const dayMinus1 = addDays(today, -1);
    const dayMinus2 = addDays(today, -2);
    const dayMinus3 = addDays(today, -3);
    const dayMinus4 = addDays(today, -4);
    const dayMinus5 = addDays(today, -5);

    // 3. Create 10 Sample Patients with diverse realistic clinical states
    const rawPatients = [
      {
        patientId: 'VC-001',
        name: 'Aarav Mehta',
        age: 42,
        gender: 'Male',
        admissionDate: new Date(Date.now() - 6 * 24 * 3600 * 1000),
        roomNumber: 101 % 74 || 1, // Room 1
        status: 'Discharge Eligible',
        outcome: 'Active',
        consecutiveFeverFreeDays: 3,
        createdBy: admin._id,
      },
      {
        patientId: 'VC-002',
        name: 'Priya Patel',
        age: 29,
        gender: 'Female',
        admissionDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        roomNumber: 2,
        status: 'Discharge Eligible',
        outcome: 'Active',
        consecutiveFeverFreeDays: 3,
        createdBy: admin._id,
      },
      {
        patientId: 'VC-003',
        name: 'Rohan Deshmukh',
        age: 34,
        gender: 'Male',
        admissionDate: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        roomNumber: 3,
        status: 'Admitted',
        outcome: 'Active',
        consecutiveFeverFreeDays: 1, // Reset by fever on day-2
        createdBy: admin._id,
      },
      {
        patientId: 'VC-004',
        name: 'Sunita Devi',
        age: 72,
        gender: 'Female',
        admissionDate: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        roomNumber: 4,
        status: 'Admitted',
        outcome: 'Active',
        consecutiveFeverFreeDays: 2, // 2 days fever free so far
        createdBy: admin._id,
      },
      {
        patientId: 'VC-005',
        name: 'Vikramaditya Joshi',
        age: 45,
        gender: 'Male',
        admissionDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        roomNumber: 5,
        status: 'Admitted',
        outcome: 'Active',
        consecutiveFeverFreeDays: 0, // Currently has active fever today!
        createdBy: admin._id,
      },
      {
        patientId: 'VC-006',
        name: 'Neha Iyer',
        age: 38,
        gender: 'Female',
        admissionDate: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        roomNumber: 6,
        status: 'Admitted',
        outcome: 'Active',
        consecutiveFeverFreeDays: 0, // Pending today's check
        createdBy: admin._id,
      },
      {
        patientId: 'VC-007',
        name: 'Amitabh Verma',
        age: 51,
        gender: 'Male',
        admissionDate: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        roomNumber: 7,
        status: 'Admitted',
        outcome: 'Active',
        consecutiveFeverFreeDays: 0, // Missing readings
        createdBy: admin._id,
      },
      {
        patientId: 'VC-008',
        name: 'Kavya Reddy',
        age: 24,
        gender: 'Female',
        admissionDate: new Date(), // Admitted today
        roomNumber: 8,
        status: 'Admitted',
        outcome: 'Active',
        consecutiveFeverFreeDays: 0, // Newly admitted
        createdBy: admin._id,
      },
      {
        patientId: 'VC-009',
        name: 'Suresh Menon',
        age: 63,
        gender: 'Male',
        admissionDate: new Date(Date.now() - 10 * 24 * 3600 * 1000),
        roomNumber: null, // Freed bed
        status: 'Discharged',
        outcome: 'Recovered',
        dischargeDate: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        dischargeNotes: 'Successfully completed 3 full consecutive fever-free days. Negative PCR.',
        consecutiveFeverFreeDays: 3,
        dischargedBy: admin._id,
        createdBy: admin._id,
      },
      {
        patientId: 'VC-010',
        name: 'Harishchandra Rao',
        age: 79,
        gender: 'Male',
        admissionDate: new Date(Date.now() - 8 * 24 * 3600 * 1000),
        roomNumber: null, // Freed bed
        status: 'Deceased',
        outcome: 'Deceased',
        deathDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        deathNotes: 'Severe respiratory distress with viral pneumonia complications.',
        consecutiveFeverFreeDays: 0,
        createdBy: admin._id,
      },
    ];

    const insertedPatients = await Patient.insertMany(rawPatients);
    console.log(`[Seed] Inserted ${insertedPatients.length} patients.`);

    const pMap = {};
    insertedPatients.forEach((p) => {
      pMap[p.patientId] = p;
    });

    // 4. Create Historical & Today's Temperature Records
    const tempRecords = [
      // VC-001 (Arthur): 3 full consecutive fever-free days (day-3, day-2, day-1) + today recorded normal
      { patient: pMap['VC-001']._id, patientId: 'VC-001', temperature: 36.7, isFever: false, recordDate: dayMinus3, nurse: nurse._id, nurseName: nurse.name, notes: 'Patient rested well' },
      { patient: pMap['VC-001']._id, patientId: 'VC-001', temperature: 36.5, isFever: false, recordDate: dayMinus2, nurse: nurse._id, nurseName: nurse.name, notes: 'Vital signs normal' },
      { patient: pMap['VC-001']._id, patientId: 'VC-001', temperature: 36.6, isFever: false, recordDate: dayMinus1, nurse: nurse._id, nurseName: nurse.name, notes: 'No symptoms reported' },
      { patient: pMap['VC-001']._id, patientId: 'VC-001', temperature: 36.4, isFever: false, recordDate: today, nurse: nurse._id, nurseName: nurse.name, notes: 'Eligible for discharge clearance' },

      // VC-002 (Eleanor): 3 consecutive days fever-free (day-2, day-1, today)
      { patient: pMap['VC-002']._id, patientId: 'VC-002', temperature: 38.4, isFever: true, recordDate: dayMinus3, nurse: nurse._id, nurseName: nurse.name, notes: 'Fever spike managed with antipyretic' },
      { patient: pMap['VC-002']._id, patientId: 'VC-002', temperature: 37.1, isFever: false, recordDate: dayMinus2, nurse: nurse._id, nurseName: nurse.name, notes: 'Temperature returned to normal' },
      { patient: pMap['VC-002']._id, patientId: 'VC-002', temperature: 36.9, isFever: false, recordDate: dayMinus1, nurse: nurse._id, nurseName: nurse.name, notes: 'Good appetite' },
      { patient: pMap['VC-002']._id, patientId: 'VC-002', temperature: 36.8, isFever: false, recordDate: today, nurse: nurse._id, nurseName: nurse.name, notes: 'Day 3 completed fever free' },

      // VC-003 (Marcus): fever on day-2, fever-free on day-1, today pending
      { patient: pMap['VC-003']._id, patientId: 'VC-003', temperature: 37.0, isFever: false, recordDate: dayMinus3, nurse: nurse._id, nurseName: nurse.name, notes: 'Stable' },
      { patient: pMap['VC-003']._id, patientId: 'VC-003', temperature: 38.6, isFever: true, recordDate: dayMinus2, nurse: nurse._id, nurseName: nurse.name, notes: 'Fever recurrence detected' },
      { patient: pMap['VC-003']._id, patientId: 'VC-003', temperature: 37.2, isFever: false, recordDate: dayMinus1, nurse: nurse._id, nurseName: nurse.name, notes: 'Streak reset to 1' },
      // VC-003 today is pending temp!

      // VC-004 (Grace): fever-free day-1 and today
      { patient: pMap['VC-004']._id, patientId: 'VC-004', temperature: 36.8, isFever: false, recordDate: dayMinus1, nurse: nurse._id, nurseName: nurse.name, notes: 'Mild cough but afebrile' },
      { patient: pMap['VC-004']._id, patientId: 'VC-004', temperature: 37.0, isFever: false, recordDate: today, nurse: nurse._id, nurseName: nurse.name, notes: 'Consecutive fever-free day 2' },

      // VC-005 (Jonathan): active high fever recorded today!
      { patient: pMap['VC-005']._id, patientId: 'VC-005', temperature: 37.4, isFever: false, recordDate: dayMinus1, nurse: nurse._id, nurseName: nurse.name, notes: 'Admitted for observation' },
      { patient: pMap['VC-005']._id, patientId: 'VC-005', temperature: 38.9, isFever: true, isUnusual: false, recordDate: today, nurse: nurse._id, nurseName: nurse.name, notes: 'High fever spike. Chills reported.' },

      // VC-006 (Samantha): pending today!
      { patient: pMap['VC-006']._id, patientId: 'VC-006', temperature: 37.2, isFever: false, recordDate: dayMinus1, nurse: nurse._id, nurseName: nurse.name, notes: 'Under observation' },

      // VC-007 (Liam): missing day-1 reading (demonstrates rule: missing days break/do not count)
      { patient: pMap['VC-007']._id, patientId: 'VC-007', temperature: 36.8, isFever: false, recordDate: dayMinus3, nurse: nurse._id, nurseName: nurse.name, notes: 'Afebrile' },
      { patient: pMap['VC-007']._id, patientId: 'VC-007', temperature: 36.9, isFever: false, recordDate: today, nurse: nurse._id, nurseName: nurse.name, notes: 'Afebrile today, but day-1 was missed' },

      // VC-009 (Discharged Viktor): completed history preserved
      { patient: pMap['VC-009']._id, patientId: 'VC-009', temperature: 36.5, isFever: false, recordDate: dayMinus4, nurse: nurse._id, nurseName: nurse.name, notes: 'Afebrile' },
      { patient: pMap['VC-009']._id, patientId: 'VC-009', temperature: 36.6, isFever: false, recordDate: dayMinus3, nurse: nurse._id, nurseName: nurse.name, notes: 'Afebrile' },
      { patient: pMap['VC-009']._id, patientId: 'VC-009', temperature: 36.4, isFever: false, recordDate: dayMinus2, nurse: nurse._id, nurseName: nurse.name, notes: 'Criteria met' },

      // VC-010 (Deceased Harold): history preserved
      { patient: pMap['VC-010']._id, patientId: 'VC-010', temperature: 39.2, isFever: true, recordDate: dayMinus4, nurse: nurse._id, nurseName: nurse.name, notes: 'High fever, ICU support required' },
      { patient: pMap['VC-010']._id, patientId: 'VC-010', temperature: 39.5, isFever: true, recordDate: dayMinus3, nurse: nurse._id, nurseName: nurse.name, notes: 'Persistent septic fever' },
    ];

    await TemperatureRecord.insertMany(tempRecords);
    console.log(`[Seed] Inserted ${tempRecords.length} temperature records.`);

    // 5. Create Doctor Visits
    const doctorVisits = [
      // VC-001 (Arthur): Visit completed today
      {
        patient: pMap['VC-001']._id,
        patientId: 'VC-001',
        visitDate: today,
        doctor: doctor._id,
        doctorName: doctor.name,
        observations: 'Patient is asymptomatic. Lungs clear to auscultation. Ready for discharge.',
        conditionSeverity: 'Stable',
        treatmentNotes: 'Approved for discharge pending admin final confirmation.',
        hadTemperatureRecordedToday: true,
        status: 'Completed',
      },
      // VC-004 (Grace): Visit completed today
      {
        patient: pMap['VC-004']._id,
        patientId: 'VC-004',
        visitDate: today,
        doctor: doctor._id,
        doctorName: doctor.name,
        observations: 'Patient oxygen saturation 98% on room air. Continue current antivirals.',
        conditionSeverity: 'Improving',
        treatmentNotes: 'Maintain oral hydration.',
        hadTemperatureRecordedToday: true,
        status: 'Completed',
      },
      // VC-005 (Jonathan): Visit completed today (fever alert)
      {
        patient: pMap['VC-005']._id,
        patientId: 'VC-005',
        visitDate: today,
        doctor: doctor._id,
        doctorName: doctor.name,
        observations: 'Patient febrile (38.9°C). Tachycardia noted. Commenced paracetamol and cooling protocol.',
        conditionSeverity: 'Guarded',
        treatmentNotes: 'Order blood cultures and chest radiograph.',
        hadTemperatureRecordedToday: true,
        status: 'Completed',
      },
      // Historical visits
      {
        patient: pMap['VC-001']._id,
        patientId: 'VC-001',
        visitDate: dayMinus1,
        doctor: doctor._id,
        doctorName: doctor.name,
        observations: 'Doing well. No fever detected.',
        conditionSeverity: 'Stable',
        status: 'Completed',
      },
      {
        patient: pMap['VC-002']._id,
        patientId: 'VC-002',
        visitDate: dayMinus1,
        doctor: doctor._id,
        doctorName: doctor.name,
        observations: 'Progressing nicely. Appetite restored.',
        conditionSeverity: 'Improving',
        status: 'Completed',
      },
    ];

    await DoctorVisit.insertMany(doctorVisits);
    console.log(`[Seed] Inserted ${doctorVisits.length} doctor visits.`);

    // 6. Create Initial Audit Logs
    const auditEvents = [
      {
        user: admin._id,
        userName: admin.name,
        userRole: admin.role,
        action: 'PATIENT_REGISTERED',
        patient: pMap['VC-001']._id,
        patientId: 'VC-001',
        details: { name: 'Aarav Mehta', roomNumber: 1 },
      },
      {
        user: nurse._id,
        userName: nurse.name,
        userRole: nurse.role,
        action: 'TEMPERATURE_RECORDED',
        patient: pMap['VC-001']._id,
        patientId: 'VC-001',
        details: { recordDate: today, temperature: 36.4, isFever: false },
      },
      {
        user: doctor._id,
        userName: doctor.name,
        userRole: doctor.role,
        action: 'DOCTOR_VISIT_COMPLETED',
        patient: pMap['VC-001']._id,
        patientId: 'VC-001',
        details: { visitDate: today, conditionSeverity: 'Stable' },
      },
      {
        user: admin._id,
        userName: admin.name,
        userRole: admin.role,
        action: 'PATIENT_DISCHARGED',
        patient: pMap['VC-009']._id,
        patientId: 'VC-009',
        details: { freedRoom: 9, dischargeDate: pMap['VC-009'].dischargeDate },
      },
      {
        user: admin._id,
        userName: admin.name,
        userRole: admin.role,
        action: 'PATIENT_DECEASED',
        patient: pMap['VC-010']._id,
        patientId: 'VC-010',
        details: { vacatedRoom: 10, deathDate: pMap['VC-010'].deathDate },
      },
    ];

    await AuditLog.insertMany(auditEvents);
    console.log(`[Seed] Inserted ${auditEvents.length} audit logs.`);

    console.log('\n=============================================');
    console.log('✅ VirusCare database seed completed successfully!');
    console.log('---------------------------------------------');
    console.log('Demo Credentials:');
    console.log('  Admin:  admin@viruscare.org  /  admin123');
    console.log('  Doctor: doctor@viruscare.org /  doctor123');
    console.log('  Nurse:  nurse@viruscare.org  /  nurse123');
    console.log('=============================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
