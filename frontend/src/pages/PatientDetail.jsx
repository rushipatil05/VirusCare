import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { formatShortDate, formatDisplayDate, formatDateTime } from '../utils/dateFormatter';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  ArrowLeft,
  Thermometer,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Bed,
  Calendar,
  User,
  FileEdit,
  History,
  ShieldCheck,
  Skull,
} from 'lucide-react';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [isTempModalOpen, setIsTempModalOpen] = useState(false);
  const [isEditTempOpen, setIsEditTempOpen] = useState(false);
  const [isDoctorVisitOpen, setIsDoctorVisitOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [isDeceasedModalOpen, setIsDeceasedModalOpen] = useState(false);

  // Form states
  const [tempVal, setTempVal] = useState('');
  const [tempNotes, setTempNotes] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Doctor visit form
  const [doctorObs, setDoctorObs] = useState('');
  const [conditionSeverity, setConditionSeverity] = useState('Stable');
  const [treatmentNotes, setTreatmentNotes] = useState('');

  // Discharge form
  const [dischargeNotes, setDischargeNotes] = useState('');

  // Deceased form
  const [deathNotes, setDeathNotes] = useState('');

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/patients/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load patient:', err);
      setError('Could not retrieve patient records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
        <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
        <h3>{error || 'Patient not found.'}</h3>
        <button
          onClick={() => navigate('/patients')}
          className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          Back to Patients
        </button>
      </div>
    );
  }

  const { patient, temperatureRecords, doctorVisits, auditLogs, dischargeEligibility, feverThreshold } = data;

  // Prepare chart data
  const chartData = (temperatureRecords || []).map((r) => ({
    date: formatShortDate(r.recordDate), // DD/MM format (e.g. 18/10)
    fullDate: formatDisplayDate(r.recordDate),
    temperature: r.temperature,
    isFever: r.isFever,
    notes: r.notes,
  }));

  // Handlers
  const handleRecordTemp = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionLoading(true);
    try {
      const res = await axiosClient.post('/temperatures', {
        patientId: patient._id,
        temperature: Number(tempVal),
        notes: tempNotes,
      });
      setSuccessMsg(res.data.message);
      setIsTempModalOpen(false);
      setTempVal('');
      setTempNotes('');
      fetchPatientDetails();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to record temperature.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCorrectTemp = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionLoading(true);
    try {
      const res = await axiosClient.put(`/temperatures/${editingRecord._id}/correct`, {
        temperature: Number(tempVal),
        correctionReason,
        notes: tempNotes,
      });
      setSuccessMsg(res.data.message);
      setIsEditTempOpen(false);
      setEditingRecord(null);
      setCorrectionReason('');
      fetchPatientDetails();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to correct temperature record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDoctorVisit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionLoading(true);
    try {
      const res = await axiosClient.post('/doctor-visits', {
        patientId: patient._id,
        observations: doctorObs,
        conditionSeverity,
        treatmentNotes,
      });
      setSuccessMsg(res.data.message);
      setIsDoctorVisitOpen(false);
      setDoctorObs('');
      setTreatmentNotes('');
      fetchPatientDetails();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to log doctor visit.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDischarge = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionLoading(true);
    try {
      const res = await axiosClient.post(`/discharges/${patient._id}/confirm`, {
        dischargeNotes,
      });
      setSuccessMsg(res.data.message);
      setIsDischargeModalOpen(false);
      fetchPatientDetails();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Discharge could not be confirmed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDeceased = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionLoading(true);
    try {
      const res = await axiosClient.post(`/patients/${patient._id}/outcome/deceased`, {
        deathNotes,
      });
      setSuccessMsg(res.data.message);
      setIsDeceasedModalOpen(false);
      fetchPatientDetails();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update patient record.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Patients</span>
        </button>
      </div>

      {/* Success alert */}
      {successMsg && (
        <div className="rounded-lg bg-emerald-50 p-4 text-xs font-medium text-emerald-800 border border-emerald-200 flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="font-bold">✕</button>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
              {patient.patientId.replace('VC-', '')}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
                  {patient.patientId}
                </span>
                <StatusBadge status={patient.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {patient.age} years old • {patient.gender} • Admitted on{' '}
                {formatDisplayDate(patient.admissionDate)}
              </p>
            </div>
          </div>

          {/* Action Buttons based on Role */}
          <div className="flex flex-wrap items-center gap-2">
            {role === 'nurse' && (patient.status === 'Admitted' || patient.status === 'Discharge Eligible') && (
              <button
                onClick={() => {
                  setActionError('');
                  setIsTempModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition"
              >
                <Thermometer className="w-4 h-4" />
                <span>Log Temperature</span>
              </button>
            )}

            {role === 'doctor' && (patient.status === 'Admitted' || patient.status === 'Discharge Eligible') && (
              <button
                onClick={() => {
                  setActionError('');
                  setIsDoctorVisitOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm transition"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Document Visit</span>
              </button>
            )}

            {role === 'admin' && patient.status === 'Discharge Eligible' && (
              <button
                onClick={() => {
                  setActionError('');
                  setIsDischargeModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm transition animate-pulse"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Discharge</span>
              </button>
            )}

            {role === 'admin' && (patient.status === 'Admitted' || patient.status === 'Discharge Eligible') && (
              <button
                onClick={() => {
                  setActionError('');
                  setIsDeceasedModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition"
              >
                <Skull className="w-4 h-4 text-rose-600" />
                <span>Mark Deceased</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick specs bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Room Assignment</span>
            <span className="font-bold text-slate-800">
              {patient.roomNumber ? `Room ${patient.roomNumber}` : 'Vacated / Released'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fever Threshold</span>
            <span className="font-bold text-slate-800">{feverThreshold}°C</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fever-Free Days</span>
            <span className="font-bold text-emerald-700">
              {dischargeEligibility?.consecutiveFeverFreeDays || 0} / 3 Days
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Clinical Outcome</span>
            <span className="font-bold text-slate-800">{patient.outcome}</span>
          </div>
        </div>
      </div>

      {/* Discharge Eligibility Status Banner */}
      <div
        className={`rounded-xl border p-5 ${
          dischargeEligibility?.isEligibleForDischarge
            ? 'border-emerald-300 bg-emerald-50/80 text-emerald-900'
            : 'border-slate-200 bg-white text-slate-800'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                dischargeEligibility?.isEligibleForDischarge ? 'text-emerald-600' : 'text-slate-400'
              }`}
            />
            <div>
              <h3 className="text-sm font-bold">
                {dischargeEligibility?.isEligibleForDischarge
                  ? 'Discharge Clearance Criterion Met (3/3 Full Days Without Fever)'
                  : `Discharge Clearance in Progress (${dischargeEligibility?.consecutiveFeverFreeDays || 0}/3 Full Days)`}
              </h3>
              <p className="text-xs mt-1 text-slate-600">
                Rule: Patient must achieve three consecutive full days without fever (≤ {feverThreshold}°C).
                Any day with fever resets the streak to 0. Missing records do not count.
              </p>
            </div>
          </div>

          {role === 'admin' && dischargeEligibility?.isEligibleForDischarge && patient.status !== 'Discharged' && (
            <button
              onClick={() => setIsDischargeModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm transition"
            >
              Execute Discharge
            </button>
          )}
        </div>
      </div>

      {/* Temperature Trend Line Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Temperature History & Clinical Trend (°C)
            </h3>
            <p className="text-xs text-slate-500">
              Fever threshold marker at {feverThreshold}°C. Temperatures above threshold reset discharge eligibility.
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No temperature records logged yet for this patient.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[35, 41]} tick={{ fontSize: 11 }} unit="°C" />
                <Tooltip
                  formatter={(val) => [`${val}°C`, 'Temperature']}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                />
                <ReferenceLine
                  y={feverThreshold}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: `Fever Threshold (${feverThreshold}°C)`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Tables: Temperature Records & Doctor Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Records Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-blue-600" />
              <span>Daily Temperature Records ({temperatureRecords.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Temp (°C)</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Recorded By</th>
                  {role === 'nurse' && <th className="px-4 py-2.5 text-right">Edit</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {temperatureRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                      {formatDisplayDate(r.recordDate)}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-800">
                      {r.temperature}°C
                      {r.isCorrected && (
                        <span className="ml-1 text-[10px] text-amber-600 font-normal">
                          (Edited)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <StatusBadge status={r.isFever ? 'Fever' : 'Normal'} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                      {r.nurseName || 'Nurse'}
                    </td>
                    {role === 'nurse' && (
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingRecord(r);
                            setTempVal(r.temperature);
                            setTempNotes(r.notes || '');
                            setCorrectionReason('');
                            setActionError('');
                            setIsEditTempOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="Correct Reading"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Doctor Visits Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span>Doctor Visit Documentation ({doctorVisits.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            {doctorVisits.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No doctor visits documented yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {doctorVisits.map((v) => (
                  <div key={v._id} className="p-4 hover:bg-slate-50/80 transition space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{formatDisplayDate(v.visitDate)}</span>
                      <StatusBadge status={v.conditionSeverity} />
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      "{v.observations}"
                    </p>
                    {v.treatmentNotes && (
                      <p className="text-slate-500 text-[11px]">
                        Plan: {v.treatmentNotes}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Doctor: {v.doctorName || 'Attending Physician'}</span>
                      <span>
                        {v.hadTemperatureRecordedToday ? '✓ Temp was verified' : '⚠️ Temp was missing at visit'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Audit Trail */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
          <History className="w-4 h-4 text-indigo-600" />
          <span>Patient Clinical & Administrative Audit Trail</span>
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
          {auditLogs && auditLogs.length > 0 ? (
            auditLogs.map((log) => (
              <div key={log._id} className="flex items-start justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-semibold text-slate-900">{log.action.replace(/_/g, ' ')}</span>
                  <span className="text-slate-500 ml-2">by {log.userName} ({log.userRole})</span>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {log.action === 'TEMPERATURE_RECORDED' ? (
                      <span>
                        Recorded <strong>{log.details?.temperature}°C</strong> ({log.details?.isFever ? 'Fever Spike' : 'Afebrile'}) • Streak: {log.details?.consecutiveFeverFreeDays ?? 0} day(s) fever-free
                      </span>
                    ) : log.action === 'TEMPERATURE_CORRECTED' ? (
                      <span>
                        Corrected: <strong>{log.details?.previousTemperature}°C</strong> &rarr; <strong>{log.details?.newTemperature}°C</strong> ({log.details?.reason})
                      </span>
                    ) : log.action === 'DOCTOR_VISIT_COMPLETED' ? (
                      <span>
                        Condition: <strong>{log.details?.conditionSeverity}</strong> • &ldquo;{log.details?.observationsSnippet}&rdquo;
                      </span>
                    ) : log.action === 'PATIENT_REGISTERED' ? (
                      <span>
                        Admitted to Room <strong>{log.details?.roomNumber}</strong> on {formatDisplayDate(log.details?.admissionDate)}
                      </span>
                    ) : log.action === 'PATIENT_DISCHARGED' ? (
                      <span>
                        Discharged on {formatDisplayDate(log.details?.dischargeDate)} • Released Room {log.details?.freedRoom}
                      </span>
                    ) : log.action === 'PATIENT_DECEASED' ? (
                      <span>
                        Deceased on {formatDisplayDate(log.details?.deathDate)} • Vacated Room {log.details?.vacatedRoom}
                      </span>
                    ) : (
                      <span>
                        {Object.entries(log.details || {}).map(([k, v]) => `${k}: ${typeof v === 'string' && v.includes('T') ? formatDisplayDate(v) : v}`).join(' • ')}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap ml-4">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-4">No audit events recorded yet.</p>
          )}
        </div>
      </div>

      {/* Record Temperature Modal (Nurse) */}
      <Modal
        isOpen={isTempModalOpen}
        onClose={() => setIsTempModalOpen(false)}
        title={`Record Daily Temperature — ${patient.name}`}
      >
        <form onSubmit={handleRecordTemp} className="space-y-4">
          {actionError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Temperature in Celsius (°C) *
            </label>
            <input
              type="number"
              step="0.1"
              min="30"
              max="45"
              required
              value={tempVal}
              onChange={(e) => setTempVal(e.target.value)}
              placeholder="e.g. 36.8"
              className="w-full text-base font-bold rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            {tempVal && Number(tempVal) > feverThreshold && (
              <p className="text-xs text-amber-700 font-semibold mt-1">
                ⚠️ Warning: {tempVal}°C is above the fever threshold ({feverThreshold}°C). This will register as fever-positive.
              </p>
            )}
            {tempVal && (Number(tempVal) < 35.0 || Number(tempVal) > 40.0) && (
              <p className="text-xs text-rose-600 font-semibold mt-1">
                Notice: Unusual clinical reading. Please double check measurement accuracy.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Clinical Note (Optional)
            </label>
            <textarea
              rows="2"
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="e.g. Patient resting quietly. No chills."
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => setIsTempModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Save Temperature'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Correct Temperature Modal (Nurse Audit Flow) */}
      <Modal
        isOpen={isEditTempOpen}
        onClose={() => setIsEditTempOpen(false)}
        title="Correct Temperature Reading (Audit Trail)"
      >
        <form onSubmit={handleCorrectTemp} className="space-y-4">
          {actionError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {actionError}
            </div>
          )}

          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
            Current recorded reading for <strong>{editingRecord?.recordDate}</strong> is{' '}
            <strong>{editingRecord?.temperature}°C</strong>. Corrections are permanently audited.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Corrected Temperature (°C) *
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={tempVal}
              onChange={(e) => setTempVal(e.target.value)}
              className="w-full text-base font-bold rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Reason for Correction *
            </label>
            <input
              type="text"
              required
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="e.g. Typo in previous record entry / Recalibrated device reading"
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => setIsEditTempOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Updating...' : 'Confirm Correction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Document Doctor Visit Modal (Doctor) */}
      <Modal
        isOpen={isDoctorVisitOpen}
        onClose={() => setIsDoctorVisitOpen(false)}
        title={`Doctor Clinical Visit — ${patient.name}`}
      >
        <form onSubmit={handleDoctorVisit} className="space-y-4">
          {actionError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Patient Clinical Condition *
            </label>
            <select
              value={conditionSeverity}
              onChange={(e) => setConditionSeverity(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
            >
              <option value="Stable">Stable</option>
              <option value="Improving">Improving</option>
              <option value="Guarded">Guarded</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Clinical Observations *
            </label>
            <textarea
              rows="3"
              required
              value={doctorObs}
              onChange={(e) => setDoctorObs(e.target.value)}
              placeholder="e.g. Chest clear, respiratory rate normal. Continues to maintain stable oxygen saturation."
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Treatment & Management Plan (Optional)
            </label>
            <input
              type="text"
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
              placeholder="e.g. Continue supportive hydration and daily monitoring"
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => setIsDoctorVisitOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Complete Visit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Discharge Modal (Admin) */}
      <Modal
        isOpen={isDischargeModalOpen}
        onClose={() => setIsDischargeModalOpen(false)}
        title="Confirm Discharge & Vacate Bed"
      >
        <form onSubmit={handleConfirmDischarge} className="space-y-4">
          {actionError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {actionError}
            </div>
          )}

          <div className="rounded-lg bg-emerald-50 p-3.5 text-xs text-emerald-900 border border-emerald-200">
            <p className="font-bold mb-1">Discharge Criteria Verified:</p>
            <p>
              Patient <strong>{patient.name}</strong> has successfully completed{' '}
              <strong>{dischargeEligibility?.consecutiveFeverFreeDays} consecutive full calendar days</strong> without
              fever.
            </p>
            <p className="mt-2 text-emerald-800">
              Confirming discharge will immediately release <strong>Room {patient.roomNumber}</strong> back to the available bed pool.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Discharge Summary & Notes
            </label>
            <textarea
              rows="3"
              value={dischargeNotes}
              onChange={(e) => setDischargeNotes(e.target.value)}
              placeholder="e.g. Patient cleared after 3 fever-free days. Advised 7-day home rest."
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => setIsDischargeModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Confirm & Release Bed'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Mark Deceased Modal (Admin) */}
      <Modal
        isOpen={isDeceasedModalOpen}
        onClose={() => setIsDeceasedModalOpen(false)}
        title="Record Patient Outcome as Deceased"
      >
        <form onSubmit={handleMarkDeceased} className="space-y-4">
          {actionError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {actionError}
            </div>
          )}

          <div className="rounded-lg bg-rose-50 p-3.5 text-xs text-rose-900 border border-rose-200">
            <p className="font-bold">Caution:</p>
            <p>
              Recording patient as deceased will update mortality analytics and immediately release Room{' '}
              <strong>{patient.roomNumber}</strong>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Clinical Cause / Notes *
            </label>
            <textarea
              rows="3"
              required
              value={deathNotes}
              onChange={(e) => setDeathNotes(e.target.value)}
              placeholder="e.g. Acute respiratory failure secondary to viral pneumonia."
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => setIsDeceasedModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Recording...' : 'Confirm & Vacate Bed'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PatientDetail;
