import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Bed,
  Thermometer,
  ExternalLink,
} from 'lucide-react';

const DoctorVisits = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'

  // Visit Modal
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [observations, setObservations] = useState('');
  const [conditionSeverity, setConditionSeverity] = useState('Stable');
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/doctor-visits/today');
      setTodayData(res.data);
    } catch (err) {
      console.error('Failed to fetch doctor visits:', err);
      setError('Could not load daily doctor visit data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleOpenVisitModal = (patient) => {
    setSelectedPatient(patient);
    setObservations('');
    setConditionSeverity('Stable');
    setTreatmentNotes('');
    setModalError('');
    setIsVisitModalOpen(true);
  };

  const handleSaveVisit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      const res = await axiosClient.post('/doctor-visits', {
        patientId: selectedPatient.patient._id,
        observations,
        conditionSeverity,
        treatmentNotes,
      });

      setSuccessMsg(res.data.message);
      if (res.data.warning) {
        setSuccessMsg(`${res.data.message} (${res.data.warning})`);
      }
      setIsVisitModalOpen(false);
      fetchVisits();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to document doctor visit.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daily Doctor Rounds & Clinical Visits
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Conduct daily physician evaluations for all admitted patients.
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

      {/* Summary KPI Cards */}
      {todayData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pending Rounds Today</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600">{todayData.pendingCount}</span>
              <span className="text-xs text-slate-400">/ {todayData.totalActive} Admitted</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Completed Rounds</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600">{todayData.completedCount}</span>
              <span className="text-xs text-slate-400">Evaluations Documented</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Rounds Completion</span>
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
          Pending Doctor Rounds ({todayData?.pendingCount || 0})
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

      {/* Tab 1: Pending Visits */}
      {activeTab === 'pending' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading pending visits...</div>
          ) : todayData?.pending?.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              🎉 All admitted patients have had their daily doctor visit completed today!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Patient ID</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Room</th>
                    <th className="px-5 py-3">Today's Temperature</th>
                    <th className="px-5 py-3">Consecutive Fever-Free</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {todayData.pending.map((item) => {
                    const { patient, hasTemperatureToday, todayTemperature, todayFever } = item;
                    return (
                      <tr key={patient._id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5 font-bold text-slate-900">{patient.patientId}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          {patient.name} ({patient.age}y, {patient.gender})
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                          Room {patient.roomNumber}
                        </td>
                        <td className="px-5 py-3.5">
                          {hasTemperatureToday ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{todayTemperature}°C</span>
                              <StatusBadge status={todayFever ? 'Fever' : 'Normal'} />
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Temp Not Yet Recorded</span>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-700">
                          {patient.consecutiveFeverFreeDays || 0} / 3 Days
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/patients/${patient._id}`)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition"
                              title="View History & Charts"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>

                            {role === 'doctor' && (
                              <button
                                onClick={() => handleOpenVisitModal(item)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
                              >
                                <Stethoscope className="w-3.5 h-3.5" />
                                <span>Record Visit</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Completed Visits */}
      {activeTab === 'completed' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading records...</div>
          ) : todayData?.completed?.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No doctor visits documented yet today.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todayData.completed.map(({ patient, visit }) => (
                <div key={visit._id} className="p-4 hover:bg-slate-50/80 transition space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
                      <span className="text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                        {patient.patientId} • Room {patient.roomNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={visit.conditionSeverity} />
                      <button
                        onClick={() => navigate(`/patients/${patient._id}`)}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        Patient Profile →
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-800 font-medium leading-relaxed bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                    "{visit.observations}"
                  </p>

                  {visit.treatmentNotes && (
                    <p className="text-slate-600 text-[11px]">
                      <strong>Plan:</strong> {visit.treatmentNotes}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Attending Doctor: <strong>{visit.doctorName}</strong></span>
                    <span>
                      {visit.hadTemperatureRecordedToday
                        ? '✓ Bedside temperature was recorded prior to visit'
                        : '⚠️ Bedside temperature was pending at time of visit'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Record Doctor Visit Modal */}
      <Modal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        title={`Conduct Doctor Visit — ${selectedPatient?.patient?.name}`}
      >
        <form onSubmit={handleSaveVisit} className="space-y-4">
          {modalError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {modalError}
            </div>
          )}

          {/* Missing Temp Warning Banner */}
          {!selectedPatient?.hasTemperatureToday && (
            <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Clinical Advisory:</strong> Today's nurse temperature reading has not yet been recorded for this patient.
                You can proceed to document this visit, and this status will be flagged in the clinical record.
              </div>
            </div>
          )}

          {selectedPatient?.hasTemperatureToday && (
            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 border border-blue-200">
              Today's recorded temperature: <strong>{selectedPatient.todayTemperature}°C</strong>{' '}
              ({selectedPatient.todayFever ? 'Fever Spike' : 'Afebrile'})
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
              Clinical Observations & Assessment *
            </label>
            <textarea
              rows="3"
              required
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="e.g. Chest sounds clear, patient ambulatory with good hydration. No supplemental oxygen required."
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Treatment & Prescription Orders (Optional)
            </label>
            <input
              type="text"
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
              placeholder="e.g. Continue multivitamin support and monitor fluid intake."
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => setIsVisitModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {modalLoading ? 'Saving...' : 'Complete Doctor Visit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DoctorVisits;
