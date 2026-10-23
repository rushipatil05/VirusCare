import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { formatDisplayDate } from '../utils/dateFormatter';
import {
  CheckCircle2,
  Sliders,
  AlertTriangle,
  Bed,
  Calendar,
  ShieldCheck,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';

const Discharges = () => {
  const { role } = useAuth();

  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);
  const [dischargedHistory, setDischargedHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Threshold edit
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const [newThreshold, setNewThreshold] = useState('38.0');
  const [thresholdLoading, setThresholdLoading] = useState(false);

  // Discharge modal
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [dischargeLoading, setDischargeLoading] = useState(false);
  const [dischargeError, setDischargeError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eligibleRes, configRes, historyRes] = await Promise.all([
        axiosClient.get('/discharges/eligible'),
        axiosClient.get('/config'),
        axiosClient.get('/patients?status=Discharged'),
      ]);

      setData(eligibleRes.data);
      setConfig(configRes.data.config);
      setNewThreshold(String(configRes.data.config.feverThreshold || 38.0));
      setDischargedHistory(historyRes.data.patients || []);
    } catch (err) {
      console.error('Failed to load discharge data:', err);
      setError('Could not retrieve discharge evaluation data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateThreshold = async (e) => {
    e.preventDefault();
    setThresholdLoading(true);
    try {
      const res = await axiosClient.put('/config', {
        feverThreshold: Number(newThreshold),
      });
      setSuccessMsg(res.data.message);
      setIsEditingThreshold(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update fever threshold.');
    } finally {
      setThresholdLoading(false);
    }
  };

  const handleOpenDischarge = (patient) => {
    setSelectedPatient(patient);
    setDischargeNotes('Completed required 3 consecutive days afebrile. Ready for discharge.');
    setDischargeError('');
    setIsDischargeModalOpen(true);
  };

  const handleConfirmDischarge = async (e) => {
    e.preventDefault();
    setDischargeError('');
    setDischargeLoading(true);
    try {
      const res = await axiosClient.post(`/discharges/${selectedPatient._id}/confirm`, {
        dischargeNotes,
      });
      setSuccessMsg(res.data.message);
      setIsDischargeModalOpen(false);
      fetchData();
    } catch (err) {
      setDischargeError(err.response?.data?.message || 'Failed to execute discharge.');
    } finally {
      setDischargeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Discharge Management & Bed Deallocation
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Automated qualification: 3 consecutive full calendar days without fever (≤ {config?.feverThreshold || 38.0}°C).
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="font-bold">✕</button>
        </div>
      )}

      {/* Configurable Fever Threshold Card */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Facility Fever Threshold Configuration
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Current: {config?.feverThreshold || 38.0}°C
              </span>
            </div>
            <p className="text-xs text-blue-800/80 mt-1">
              Readings strictly above this threshold reset the patient's consecutive fever-free count back to 0.
            </p>
          </div>
        </div>

        {role === 'admin' ? (
          <div>
            {isEditingThreshold ? (
              <form onSubmit={handleUpdateThreshold} className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="35"
                  max="42"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  className="w-20 px-2 py-1 text-xs border border-blue-300 rounded font-bold bg-white"
                />
                <button
                  type="submit"
                  disabled={thresholdLoading}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition"
                >
                  {thresholdLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingThreshold(false)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsEditingThreshold(true)}
                className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-50 transition"
              >
                Change Threshold
              </button>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-slate-500">Only Admin can adjust threshold</span>
        )}
      </div>

      {/* Table 1: Discharge-Eligible Patients (Criteria Met) */}
      <div className="rounded-xl border border-emerald-300 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-emerald-100 bg-emerald-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-emerald-950">
              Clearance Granted: Eligible for Discharge ({data?.eligibleCount || 0})
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-700">
            Full 3-Day Protocol Verified
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Evaluating clinical records...</div>
        ) : data?.eligiblePatients?.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No patients currently meet the 3-day consecutive fever-free rule.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Patient ID</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Room</th>
                  <th className="px-5 py-3">Consecutive Days</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.eligiblePatients.map(({ patient, consecutiveFeverFreeDays }) => (
                  <tr key={patient._id} className="hover:bg-emerald-50/40 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{patient.patientId}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {patient.name} ({patient.age}y, {patient.gender})
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      Room {patient.roomNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                        ✓ {consecutiveFeverFreeDays} / 3 Days Complete
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status="Discharge Eligible" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {role === 'admin' ? (
                        <button
                          onClick={() => handleOpenDischarge(patient)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition shadow-sm text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Discharge</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Admin authorization required</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Table 2: Ongoing Monitoring Patients */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Patients Under Observation ({data?.monitoringPatients?.length || 0})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Pending 3 Consecutive Fever-Free Days
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Patient ID</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Room</th>
                  <th className="px-5 py-3">Current Streak</th>
                  <th className="px-5 py-3">Streak Progress</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data?.monitoringPatients?.map(({ patient, consecutiveFeverFreeDays }) => (
                  <tr key={patient._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{patient.patientId}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{patient.name}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">Room {patient.roomNumber}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">
                      {consecutiveFeverFreeDays} / 3 Days
                    </td>
                    <td className="px-5 py-3.5 w-48">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (consecutiveFeverFreeDays / 3) * 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status="Admitted" text="Monitoring" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Table 3: Discharged Patients History */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Historical Discharged Patient Records ({dischargedHistory.length})
          </h3>
          <span className="text-xs text-slate-500">
            Rooms Freed Immediately Upon Discharge
          </span>
        </div>

        {dischargedHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No discharged patients recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Patient ID</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Discharge Date</th>
                  <th className="px-5 py-3">Outcome</th>
                  <th className="px-5 py-3">Discharge Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {dischargedHistory.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{p.patientId}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{p.name}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {formatDisplayDate(p.dischargeDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status="Discharged" text="Recovered" />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-sm truncate italic">
                      {p.dischargeNotes || 'Criteria met. Discharged home.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Discharge Modal */}
      <Modal
        isOpen={isDischargeModalOpen}
        onClose={() => setIsDischargeModalOpen(false)}
        title="Admin Discharge Authorization"
      >
        <form onSubmit={handleConfirmDischarge} className="space-y-4">
          {dischargeError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {dischargeError}
            </div>
          )}

          <div className="rounded-lg bg-emerald-50 p-3.5 text-xs text-emerald-900 border border-emerald-200">
            <p className="font-bold">Confirmation of Discharge Clearance:</p>
            <p className="mt-1">
              Patient: <strong>{selectedPatient?.name} ({selectedPatient?.patientId})</strong>
            </p>
            <p>
              Current Bed: <strong>Room {selectedPatient?.roomNumber}</strong> will be released immediately and made available for new admissions.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Discharge Notes & Summary *
            </label>
            <textarea
              rows="3"
              required
              value={dischargeNotes}
              onChange={(e) => setDischargeNotes(e.target.value)}
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
              disabled={dischargeLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {dischargeLoading ? 'Releasing Bed...' : 'Confirm & Release Room'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Discharges;
