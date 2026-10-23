import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { formatDisplayDate } from '../utils/dateFormatter';
import {
  Users,
  Search,
  Plus,
  Bed,
  Filter,
  AlertCircle,
  CheckCircle,
  Eye,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

const Patients = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register Modal state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const [newPatient, setNewPatient] = useState({
    name: '',
    patientId: '',
    age: '',
    gender: 'Male',
    roomNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
  });

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/patients', {
        params: { search, status: statusFilter },
      });
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setError('Could not load patients list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      const res = await axiosClient.get('/patients/rooms/available');
      setAvailableRooms(res.data.availableRooms || []);
      if (res.data.availableRooms?.length > 0 && !newPatient.roomNumber) {
        setNewPatient((prev) => ({ ...prev, roomNumber: res.data.availableRooms[0] }));
      }
    } catch (err) {
      console.error('Failed to load available rooms:', err);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, statusFilter]);

  const handleOpenRegister = () => {
    setRegisterError('');
    fetchAvailableRooms();
    setIsRegisterOpen(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);
    try {
      const res = await axiosClient.post('/patients', newPatient);
      setSuccessMsg(res.data.message);
      setIsRegisterOpen(false);
      // Reset form
      setNewPatient({
        name: '',
        patientId: '',
        age: '',
        gender: 'Male',
        roomNumber: '',
        admissionDate: new Date().toISOString().split('T')[0],
      });
      fetchPatients();
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Failed to register patient.');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Patient Directory & Bed Allocation
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View clinical statuses, room assignments, and discharge eligibility across the facility.
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={handleOpenRegister}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        )}
      </div>

      {/* Success notification */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name or ID (e.g. VC-001)..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
          >
            <option value="All">All Statuses</option>
            <option value="Admitted">Admitted</option>
            <option value="Discharge Eligible">Discharge Eligible</option>
            <option value="Discharged">Discharged</option>
            <option value="Deceased">Deceased</option>
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
            Loading patient records...
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No patients found matching the current search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Patient ID</th>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Demographics</th>
                  <th className="px-5 py-3.5">Room</th>
                  <th className="px-5 py-3.5">Admission Date</th>
                  <th className="px-5 py-3.5">Fever-Free Streak</th>
                  <th className="px-5 py-3.5">Today's Checks</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {patients.map((p) => (
                  <tr
                    key={p._id}
                    onClick={() => navigate(`/patients/${p._id}`)}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {p.patientId}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {p.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {p.age} yrs • {p.gender}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-800">
                      {p.roomNumber ? (
                        <span className="inline-flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-slate-400" />
                          <span>Room {p.roomNumber}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatDisplayDate(p.admissionDate)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {p.status === 'Discharged' ? (
                        <span className="text-purple-700 font-medium">Completed</span>
                      ) : p.status === 'Deceased' ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            p.consecutiveFeverFreeDays >= 3
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.consecutiveFeverFreeDays > 0
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.consecutiveFeverFreeDays || 0} / 3 Days
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {p.status === 'Admitted' || p.status === 'Discharge Eligible' ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            title={p.hasTemperatureToday ? `Temp: ${p.todayTemperature}°C` : 'Pending temperature'}
                            className={`w-2 h-2 rounded-full ${
                              p.hasTemperatureToday
                                ? p.todayFever
                                  ? 'bg-amber-500 ring-2 ring-amber-200'
                                  : 'bg-emerald-500'
                                : 'bg-slate-300'
                            }`}
                          />
                          <span className="text-[11px] text-slate-500">
                            {p.hasTemperatureToday ? `${p.todayTemperature}°C` : 'Temp Pending'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patients/${p._id}`);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Patient Modal (Admin Only) */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register New Patient & Allocate Bed"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {registerError && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{registerError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Patient ID (Optional)
              </label>
              <input
                type="text"
                value={newPatient.patientId}
                onChange={(e) => setNewPatient({ ...newPatient, patientId: e.target.value })}
                placeholder="Auto-generated if empty"
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Age *
              </label>
              <input
                type="number"
                required
                min="0"
                max="125"
                value={newPatient.age}
                onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                placeholder="e.g. 45"
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Gender *
              </label>
              <select
                value={newPatient.gender}
                onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Assign Room Number (1 - 74) *
              </label>
              {availableRooms.length === 0 ? (
                <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                  No rooms available. Facility at full 74-bed capacity!
                </div>
              ) : (
                <select
                  required
                  value={newPatient.roomNumber}
                  onChange={(e) => setNewPatient({ ...newPatient, roomNumber: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                >
                  <option value="">Select available room...</option>
                  {availableRooms.map((r) => (
                    <option key={r} value={r}>
                      Room {r} (Available)
                    </option>
                  ))}
                </select>
              )}
              <span className="text-[10px] text-slate-500 mt-1 block">
                {availableRooms.length} available out of 74 total beds
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Admission Date *
              </label>
              <input
                type="date"
                required
                value={newPatient.admissionDate}
                onChange={(e) => setNewPatient({ ...newPatient, admissionDate: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registerLoading || availableRooms.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {registerLoading ? 'Allocating Bed...' : 'Confirm Admission'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Patients;
