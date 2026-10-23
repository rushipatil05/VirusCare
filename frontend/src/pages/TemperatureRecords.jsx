import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { formatDisplayDate } from '../utils/dateFormatter';
import {
  Thermometer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  FileEdit,
  Search,
  User,
  Bed,
  Info,
} from 'lucide-react';

const TemperatureRecords = () => {
  const { role } = useAuth();
  const [todayData, setTodayData] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'

  // Record Temp Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [temperatureVal, setTemperatureVal] = useState('');
  const [notesVal, setNotesVal] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Correction Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const [todayRes, configRes] = await Promise.all([
        axiosClient.get('/temperatures/today'),
        axiosClient.get('/config'),
      ]);
      setTodayData(todayRes.data);
      setConfig(configRes.data.config);
    } catch (err) {
      console.error('Failed to fetch temperature data:', err);
      setError('Could not load temperature monitoring data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleOpenRecordModal = (patientId = '') => {
    setModalError('');
    setSelectedPatientId(patientId);
    setTemperatureVal('');
    setNotesVal('');
    setIsRecordModalOpen(true);
  };

  const handleSaveTemperature = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      const res = await axiosClient.post('/temperatures', {
        patientId: selectedPatientId,
        temperature: Number(temperatureVal),
        notes: notesVal,
      });

      setSuccessMsg(res.data.message);
      setIsRecordModalOpen(false);
      fetchRecords();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to record temperature reading.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEditModal = (record) => {
    setEditingRecord(record);
    setTemperatureVal(record.temperature);
    setNotesVal(record.notes || '');
    setCorrectionReason('');
    setModalError('');
    setIsEditModalOpen(true);
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      const res = await axiosClient.put(`/temperatures/${editingRecord._id}/correct`, {
        temperature: Number(temperatureVal),
        correctionReason,
        notes: notesVal,
      });

      setSuccessMsg(res.data.message);
      setIsEditModalOpen(false);
      fetchRecords();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to correct temperature record.');
    } finally {
      setModalLoading(false);
    }
  };

  const feverThreshold = config?.feverThreshold || 38.0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daily Temperature Rounds
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Record, monitor, and audit daily temperatures. Threshold: <strong>{feverThreshold}°C</strong>.
          </p>
        </div>

        {role === 'nurse' && (
          <button
            onClick={() => handleOpenRecordModal('')}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Patient Temperature</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="font-bold">✕</button>
        </div>
      )}

      {/* Summary KPI Cards */}
      {todayData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pending Today</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600">{todayData.pendingCount}</span>
              <span className="text-xs text-slate-400">/ {todayData.totalActive} Admitted</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Completed Today</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600">{todayData.completedCount}</span>
              <span className="text-xs text-slate-400">Recorded Readings</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Completion Rate</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">{todayData.completionRate}%</span>
              <span className="text-xs text-slate-400">Daily Compliance</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'pending'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Pending Checks ({todayData?.pendingCount || 0})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'completed'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Completed Today ({todayData?.completedCount || 0})
        </button>
      </div>

      {/* Tab 1: Pending Checks */}
      {activeTab === 'pending' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading records...</div>
          ) : todayData?.pending?.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              🎉 All admitted patients have had their temperatures checked for today!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Patient ID</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Room</th>
                    <th className="px-5 py-3">Fever-Free Streak</th>
                    <th className="px-5 py-3">Status</th>
                    {role === 'nurse' && <th className="px-5 py-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {todayData.pending.map(({ patient }) => (
                    <tr key={patient._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{patient.patientId}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {patient.name} ({patient.age}y, {patient.gender})
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        Room {patient.roomNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-700">
                          {patient.consecutiveFeverFreeDays || 0} / 3 Days
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Pending Reading
                        </span>
                      </td>
                      {role === 'nurse' && (
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenRecordModal(patient._id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                          >
                            <Thermometer className="w-3.5 h-3.5" />
                            <span>Record Temp</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Completed Checks */}
      {activeTab === 'completed' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading records...</div>
          ) : todayData?.completed?.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No temperatures recorded yet today.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Patient ID</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Room</th>
                    <th className="px-5 py-3">Recorded Temp</th>
                    <th className="px-5 py-3">Clinical Evaluation</th>
                    <th className="px-5 py-3">Nurse</th>
                    <th className="px-5 py-3">Notes</th>
                    {role === 'nurse' && <th className="px-5 py-3 text-right">Correction</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {todayData.completed.map(({ patient, record }) => (
                    <tr key={record._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{patient.patientId}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">{patient.name}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">Room {patient.roomNumber}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {record.temperature}°C
                        {record.isCorrected && (
                          <span className="ml-1 text-[10px] text-amber-600 font-normal">
                            (Corrected)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={record.isFever ? 'Fever Detected' : 'Afebrile'} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{record.nurseName || 'Nurse'}</td>
                      <td className="px-5 py-3.5 text-slate-500 italic max-w-xs truncate">
                        {record.notes || '—'}
                      </td>
                      {role === 'nurse' && (
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenEditModal(record)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-[11px] font-semibold"
                          >
                            <FileEdit className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Temperature Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Daily Patient Temperature"
      >
        <form onSubmit={handleSaveTemperature} className="space-y-4">
          {modalError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Select Admitted Patient *
            </label>
            <select
              required
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
            >
              <option value="">Choose patient...</option>
              {todayData?.pending?.map(({ patient }) => (
                <option key={patient._id} value={patient._id}>
                  {patient.patientId} — {patient.name} (Room {patient.roomNumber})
                </option>
              ))}
            </select>
          </div>

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
              value={temperatureVal}
              onChange={(e) => setTemperatureVal(e.target.value)}
              placeholder="e.g. 37.2"
              className="w-full text-lg font-bold rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            {temperatureVal && Number(temperatureVal) > feverThreshold && (
              <p className="text-xs text-amber-700 font-semibold mt-1">
                🔥 Above threshold ({feverThreshold}°C). Will be marked as fever-positive!
              </p>
            )}
            {temperatureVal && (Number(temperatureVal) < 35.0 || Number(temperatureVal) > 40.0) && (
              <p className="text-xs text-rose-600 font-semibold mt-1">
                ⚠️ Unusual clinical value. Please double-check for thermometer error.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nurse Notes (Optional)
            </label>
            <textarea
              rows="2"
              value={notesVal}
              onChange={(e) => setNotesVal(e.target.value)}
              placeholder="e.g. Patient feeling improved, afebrile."
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading || !selectedPatientId}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {modalLoading ? 'Saving Reading...' : 'Save Temperature'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit / Correction Modal (Nurse Audit Flow) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Correct Temperature Reading"
      >
        <form onSubmit={handleSaveCorrection} className="space-y-4">
          {modalError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {modalError}
            </div>
          )}

          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
            Previous recorded reading for <strong>{formatDisplayDate(editingRecord?.recordDate)}</strong> was{' '}
            <strong>{editingRecord?.temperature}°C</strong>. A reason for this correction is required for the permanent audit trail.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Corrected Temperature (°C) *
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={temperatureVal}
              onChange={(e) => setTemperatureVal(e.target.value)}
              className="w-full text-lg font-bold rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Correction Reason (Required for Audit Log) *
            </label>
            <input
              type="text"
              required
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="e.g. Correcting transcription typo from bedside chart"
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Updated Notes (Optional)
            </label>
            <textarea
              rows="2"
              value={notesVal}
              onChange={(e) => setNotesVal(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {modalLoading ? 'Saving...' : 'Submit Audit Correction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TemperatureRecords;
