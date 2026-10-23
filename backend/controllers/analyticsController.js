const Patient = require('../models/Patient');
const TemperatureRecord = require('../models/TemperatureRecord');
const DoctorVisit = require('../models/DoctorVisit');
const FacilityConfig = require('../models/FacilityConfig');
const { getTodayDateString, addDays } = require('../utils/dateUtils');

// @desc Get comprehensive dashboard and analytics data
// @route GET /api/analytics
// @access All authenticated roles
const getAnalytics = async (req, res, next) => {
  try {
    const config = await FacilityConfig.getConfig();
    const maxCapacity = config.maxCapacity || 74;
    const feverThreshold = config.feverThreshold || 38.0;
    const todayStr = getTodayDateString();

    // 1. Bed & Patient counts
    const activePatients = await Patient.find({
      status: { $in: ['Admitted', 'Discharge Eligible'] },
    }).lean();

    const totalActive = activePatients.length;
    const occupiedBeds = totalActive; // 1 bed per admitted patient
    const availableBeds = Math.max(0, maxCapacity - occupiedBeds);
    const occupancyRate = maxCapacity > 0 ? ((occupiedBeds / maxCapacity) * 100).toFixed(1) : '0';

    // Discharged & Deceased counts
    const totalDischarged = await Patient.countDocuments({ status: 'Discharged' });
    const totalDeaths = await Patient.countDocuments({ status: 'Deceased' });
    const totalEverAdmitted = await Patient.countDocuments();

    // Eligible for discharge count
    const eligibleForDischarge = activePatients.filter(
      (p) => p.status === 'Discharge Eligible' || (p.consecutiveFeverFreeDays && p.consecutiveFeverFreeDays >= 3)
    ).length;

    // 2. Daily task completion for today
    const activePatientIds = activePatients.map((p) => p._id);

    // Completed today's temp checks
    const todayTempRecords = await TemperatureRecord.find({
      patient: { $in: activePatientIds },
      recordDate: todayStr,
    }).lean();

    const tempCompletedCount = todayTempRecords.length;
    const tempPendingCount = Math.max(0, totalActive - tempCompletedCount);
    const tempCompletionRate = totalActive > 0 ? Math.round((tempCompletedCount / totalActive) * 100) : 0;

    // Completed today's doctor visits
    const todayDoctorVisits = await DoctorVisit.find({
      patient: { $in: activePatientIds },
      visitDate: todayStr,
    }).lean();

    const visitCompletedCount = todayDoctorVisits.length;
    const visitPendingCount = Math.max(0, totalActive - visitCompletedCount);
    const visitCompletionRate = totalActive > 0 ? Math.round((visitCompletedCount / totalActive) * 100) : 0;

    // 3. Clinical Outcomes & Benchmark Analysis
    // Closed cases = resolved outcomes (Discharged / Recovered + Deceased)
    // Closed cases cohort denominator is standard epidemiological method:
    // Closed Cases = Discharged + Deaths
    // Missing / unresolved outcomes (currently admitted) are strictly excluded from closed cases rate
    const closedCases = totalDischarged + totalDeaths;

    let mortalityRate = 0;
    let survivalRate = 0;

    if (closedCases > 0) {
      mortalityRate = parseFloat(((totalDeaths / closedCases) * 100).toFixed(2));
      survivalRate = parseFloat(((totalDischarged / closedCases) * 100).toFixed(2));
    }

    // Cohort rate (Deaths / Total Ever Admitted)
    const allCohortMortalityRate = totalEverAdmitted > 0
      ? parseFloat(((totalDeaths / totalEverAdmitted) * 100).toFixed(2))
      : 0;

    const expectedBenchmarkMortality = 15.0; // 15% benchmark
    const exceedsBenchmark = mortalityRate > expectedBenchmarkMortality;
    const benchmarkVariance = parseFloat((mortalityRate - expectedBenchmarkMortality).toFixed(2));

    // 4. Generate 7-day trend history for charts
    const trendDays = [];
    for (let i = 6; i >= 0; i--) {
      const dStr = addDays(todayStr, -i);
      const tempsOnDay = await TemperatureRecord.countDocuments({ recordDate: dStr });
      const feversOnDay = await TemperatureRecord.countDocuments({ recordDate: dStr, isFever: true });
      const visitsOnDay = await DoctorVisit.countDocuments({ visitDate: dStr });

      const [y, m, d] = dStr.split('-');
      trendDays.push({
        date: `${d}/${m}`, // DD/MM format (e.g. 18/10)
        fullDate: dStr,
        displayDate: `${d}/${m}/${y}`,
        tempChecks: tempsOnDay,
        feversDetected: feversOnDay,
        doctorVisits: visitsOnDay,
      });
    }

    // Patient status distribution
    const statusDistribution = [
      { name: 'Admitted (Monitoring)', value: totalActive - eligibleForDischarge, color: '#3b82f6' },
      { name: 'Discharge Eligible', value: eligibleForDischarge, color: '#10b981' },
      { name: 'Discharged (Recovered)', value: totalDischarged, color: '#6366f1' },
      { name: 'Deceased', value: totalDeaths, color: '#ef4444' },
    ].filter((item) => item.value > 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalAdmitted: totalActive,
          maxCapacity,
          occupiedBeds,
          availableBeds,
          occupancyRate,
          eligibleForDischarge,
          totalDischarged,
          totalDeaths,
          totalEverAdmitted,
          todayPendingTempChecks: tempPendingCount,
          todayCompletedTempChecks: tempCompletedCount,
          tempCompletionRate,
          todayPendingDoctorVisits: visitPendingCount,
          todayCompletedDoctorVisits: visitCompletedCount,
          visitCompletionRate,
        },
        epidemiology: {
          closedCasesCohort: {
            closedCases,
            totalDischarged,
            totalDeaths,
            mortalityRate,
            survivalRate,
            denominatorDescription: 'Resolved / Closed Patient Outcomes (Discharged + Deceased)',
            notes: 'Excludes active admissions to prevent underestimating mortality.',
          },
          allAdmittedCohort: {
            totalEverAdmitted,
            allCohortMortalityRate,
            denominatorDescription: 'Total Lifetime Admitted Patient Cohort',
          },
          benchmark: {
            expectedMortalityRate: expectedBenchmarkMortality,
            observedMortalityRate: mortalityRate,
            exceedsBenchmark,
            variance: benchmarkVariance,
            status: exceedsBenchmark ? 'CRITICAL_ALERT' : 'NORMAL',
            alertMessage: exceedsBenchmark
              ? `Warning: Current mortality rate (${mortalityRate}%) exceeds the 15.0% expected benchmark by +${benchmarkVariance}%!`
              : `Mortality rate (${mortalityRate}%) remains within the expected 15.0% facility benchmark.`,
          },
        },
        facilityConfig: {
          feverThreshold,
          maxCapacity,
          facilityName: config.facilityName,
        },
        trends: trendDays,
        statusDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
};
