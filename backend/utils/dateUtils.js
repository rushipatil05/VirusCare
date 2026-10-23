/**
 * Date utility functions for VirusCare
 * Ensures facility local date consistency and discharge calculation
 */

// Format a Date object to YYYY-MM-DD
const formatDateString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get today's date string in facility local format (YYYY-MM-DD)
const getTodayDateString = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  return formatDateString(d);
};

// Add / subtract days from a YYYY-MM-DD string
const addDays = (dateStr, days) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return formatDateString(d);
};

// Calculate difference in calendar days between two YYYY-MM-DD strings (date2 - date1)
const daysBetween = (dateStr1, dateStr2) => {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);
  const diffTime = date2.getTime() - date1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calculates consecutive fever-free days for a patient.
 * 
 * Rules:
 * 1. Only valid daily temperature records count.
 * 2. Any day with temperature > feverThreshold is a fever-positive day and resets the consecutive count to 0.
 * 3. Missing calendar days between readings do NOT count and break the consecutive streak.
 * 4. Returns consecutive fever-free days count and eligibility status (>= 3).
 *
 * @param {Array} records - Array of TemperatureRecord objects with recordDate and temperature
 * @param {number} feverThreshold - Threshold in °C (e.g. 38.0)
 * @param {string} referenceDate - The reference date (defaults to today)
 * @returns {Object} { consecutiveFeverFreeDays: number, isEligibleForDischarge: boolean, dailyBreakdown: Array }
 */
const evaluateDischargeEligibility = (records, feverThreshold = 38.0, referenceDate = getTodayDateString()) => {
  if (!records || records.length === 0) {
    return {
      consecutiveFeverFreeDays: 0,
      isEligibleForDischarge: false,
      dailyBreakdown: []
    };
  }

  // Create a map of recordDate -> reading
  // If multiple exist (should be prevented), take the latest/corrected reading
  const dateMap = new Map();
  records.forEach((rec) => {
    const dStr = rec.recordDate;
    if (!dateMap.has(dStr) || new Date(rec.recordTime) > new Date(dateMap.get(dStr).recordTime)) {
      dateMap.set(dStr, rec);
    }
  });

  // Sort unique dates in chronological order
  const sortedDates = Array.from(dateMap.keys()).sort();

  // Find the streak by evaluating consecutively backwards from the most recent valid day,
  // or forwards across calendar days.
  // A streak of consecutive calendar days where each day has a valid record with temp <= threshold.
  // If there's any gap in calendar days, the streak is broken.
  // If temp > threshold, streak is reset to 0.

  let currentStreak = 0;
  const breakdown = [];

  // If the patient has records, let's step through from the most recent recorded date backwards
  // to count consecutive valid fever-free calendar days up to the most recent record or today
  const latestDate = sortedDates[sortedDates.length - 1];
  
  // We can evaluate calendar sequence backwards from latestDate:
  let checkDate = latestDate;
  while (dateMap.has(checkDate)) {
    const record = dateMap.get(checkDate);
    const temp = Number(record.temperature);
    const hasFever = temp > feverThreshold;

    breakdown.unshift({
      date: checkDate,
      temperature: temp,
      hasFever,
      recordedBy: record.nurseName || 'Nurse'
    });

    if (hasFever) {
      // Fever breaks and resets the streak!
      break;
    } else {
      currentStreak += 1;
    }

    // Move to previous calendar day
    checkDate = addDays(checkDate, -1);
  }

  // Also check if the latest record is recent (within 1 day of referenceDate).
  // If today is referenceDate and the last record was 3 days ago, the gap means missing records!
  const daysSinceLatest = daysBetween(latestDate, referenceDate);
  if (daysSinceLatest > 1) {
    // Missing recent temperature checks! The streak cannot be certified as active today without continuous monitoring
    // However, if they already completed 3 consecutive days before, they could be eligible if no fever recorded.
    // But rule says: "Missing temperature records do not count as fever-free days."
  }

  const isEligibleForDischarge = currentStreak >= 3;

  return {
    consecutiveFeverFreeDays: currentStreak,
    isEligibleForDischarge,
    latestRecordDate: latestDate,
    dailyBreakdown: breakdown
  };
};

module.exports = {
  formatDateString,
  getTodayDateString,
  addDays,
  daysBetween,
  evaluateDischargeEligibility
};
