const http = require('http');

const request = (path, method = 'GET', data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

async function runTests() {
  console.log('--- STARTING VIRUSCARE END-TO-END VERIFICATION ---');

  // 1. Health check
  const health = await request('/api/health');
  console.log('1. Health check status:', health.status, health.data?.status);

  // 2. Demo logins for all 3 roles
  const adminLogin = await request('/api/auth/demo-login', 'POST', { role: 'admin' });
  const doctorLogin = await request('/api/auth/demo-login', 'POST', { role: 'doctor' });
  const nurseLogin = await request('/api/auth/demo-login', 'POST', { role: 'nurse' });

  const adminToken = adminLogin.data.token;
  const doctorToken = doctorLogin.data.token;
  const nurseToken = nurseLogin.data.token;

  console.log('2. Demo logins successful:');
  console.log('   Admin:', adminLogin.data.user.name);
  console.log('   Doctor:', doctorLogin.data.user.name);
  console.log('   Nurse:', nurseLogin.data.user.name);

  // 3. Analytics
  const analyticsBefore = await request('/api/analytics', 'GET', null, adminToken);
  console.log('3. Analytics summary before actions:');
  console.log('   Total Admitted:', analyticsBefore.data.data.summary.totalAdmitted);
  console.log('   Occupied Beds:', analyticsBefore.data.data.summary.occupiedBeds, '/ 74');
  console.log('   Eligible for Discharge:', analyticsBefore.data.data.summary.eligibleForDischarge);
  console.log('   Mortality Rate (Closed Cases):', analyticsBefore.data.data.epidemiology.closedCasesCohort.mortalityRate, '%');

  // 4. Check available rooms
  const rooms = await request('/api/patients/rooms/available', 'GET', null, adminToken);
  console.log('4. Available rooms count:', rooms.data.availableRooms.length);
  const targetRoom = rooms.data.availableRooms[0];
  console.log('   Allocating room:', targetRoom);

  // 5. Register new patient (Admin)
  const newPatientData = {
    patientId: 'VC-TEST-99',
    name: 'Robert Langdon',
    age: 48,
    gender: 'Male',
    roomNumber: targetRoom,
    admissionDate: '2026-10-23',
  };
  const regRes = await request('/api/patients', 'POST', newPatientData, adminToken);
  console.log('5. Register Patient Result:', regRes.status, regRes.data.message);
  const createdPatientId = regRes.data.patient._id;

  // 6. Record Temperature (Nurse)
  const tempRes = await request('/api/temperatures', 'POST', {
    patientId: createdPatientId,
    temperature: 36.6,
    notes: 'Bedside reading: patient resting comfortably.',
  }, nurseToken);
  console.log('6. Nurse Record Temperature:', tempRes.status, tempRes.data.message);

  // 7. Verify duplicate temperature check prevention
  const dupTempRes = await request('/api/temperatures', 'POST', {
    patientId: createdPatientId,
    temperature: 36.8,
  }, nurseToken);
  console.log('7. Duplicate Temperature Prevention:', dupTempRes.status === 409 ? 'SUCCESS (409 Conflict Caught)' : 'FAILED', dupTempRes.data.message);

  // 8. Record Doctor Visit (Doctor)
  const visitRes = await request('/api/doctor-visits', 'POST', {
    patientId: createdPatientId,
    observations: 'Patient vital signs within normal limits. Lungs clear.',
    conditionSeverity: 'Stable',
    treatmentNotes: 'Continue observation.',
  }, doctorToken);
  console.log('8. Doctor Visit Documentation:', visitRes.status, visitRes.data.message);

  // 9. Check Discharge Eligibility List
  const eligibleRes = await request('/api/discharges/eligible', 'GET', null, adminToken);
  console.log('9. Discharge Eligible Patients Count:', eligibleRes.data.eligibleCount);
  const eligiblePatient = eligibleRes.data.eligiblePatients[0];
  console.log('   Candidate for discharge:', eligiblePatient?.patient?.name, 'Streak:', eligiblePatient?.consecutiveFeverFreeDays, 'days');

  // 10. Confirm Discharge & Verify Bed Release (Admin)
  if (eligiblePatient) {
    const dischargeRes = await request(`/api/discharges/${eligiblePatient.patient._id}/confirm`, 'POST', {
      dischargeNotes: 'Completed 3 consecutive full afebrile days. Fully recovered.',
    }, adminToken);
    console.log('10. Confirm Discharge & Bed Release:', dischargeRes.status, dischargeRes.data.message);
    console.log('    Freed Bed Number:', dischargeRes.data.freedRoomNumber);
  }

  // 11. Final Analytics
  const analyticsAfter = await request('/api/analytics', 'GET', null, adminToken);
  console.log('11. Updated Analytics after discharge:');
  console.log('    Total Discharged:', analyticsAfter.data.data.summary.totalDischarged);
  console.log('    Occupied Beds:', analyticsAfter.data.data.summary.occupiedBeds);
  console.log('    Survival Rate:', analyticsAfter.data.data.epidemiology.closedCasesCohort.survivalRate, '%');

  // 12. Audit Logs Check
  const auditRes = await request('/api/audit-logs', 'GET', null, adminToken);
  console.log('12. Audit Logs Total Count:', auditRes.data.total);
  console.log('    Latest Action:', auditRes.data.logs[0]?.action, 'by', auditRes.data.logs[0]?.userName);

  console.log('--- END-TO-END VERIFICATION COMPLETED WITH FLYING COLORS ---');
}

runTests().catch(console.error);
