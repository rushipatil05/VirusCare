import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { formatDateTime, formatDisplayDate } from '../utils/dateFormatter';
import {
  FileText,
  Search,
  Filter,
  Clock,
  Shield,
  User,
  ArrowRight,
} from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchPatient, setSearchPatient] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/audit-logs', {
        params: {
          patientId: searchPatient.trim() || undefined,
          action: actionFilter || undefined,
          limit: 100,
        },
      });
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Could not retrieve audit trail logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchPatient, actionFilter]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'PATIENT_REGISTERED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">PATIENT REGISTERED</span>;
      case 'TEMPERATURE_RECORDED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">TEMP RECORDED</span>;
      case 'TEMPERATURE_CORRECTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">TEMP CORRECTED</span>;
      case 'DOCTOR_VISIT_COMPLETED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">DOCTOR VISIT</span>;
      case 'PATIENT_DISCHARGED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">PATIENT DISCHARGED</span>;
      case 'PATIENT_DECEASED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">PATIENT DECEASED</span>;
      case 'FEVER_THRESHOLD_UPDATED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">THRESHOLD UPDATED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{action}</span>;
    }
  };

  const renderEventDetails = (log) => {
    const details = log.details || {};
    switch (log.action) {
      case 'PATIENT_REGISTERED':
        return (
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-900">
              {details.name ? `Admitted ${details.name}` : 'Patient Admitted'}
              {details.roomNumber ? ` to Room ${details.roomNumber}` : ''}
            </div>
            {details.admissionDate && (
              <div className="text-[11px] text-slate-500">
                Admission: {formatDisplayDate(details.admissionDate)}
                {details.initialTemperature ? ` • Initial: ${details.initialTemperature}°C` : ''}
              </div>
            )}
          </div>
        );
      case 'TEMPERATURE_RECORDED':
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className={`font-bold ${details.isFever ? 'text-rose-600' : 'text-slate-900'}`}>
                {details.temperature ? `${details.temperature}°C` : 'Temp Logged'}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                  details.isFever ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {details.isFever ? 'Fever Spike' : 'Afebrile'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {details.recordDate && `Date: ${formatDisplayDate(details.recordDate)} • `}
              Streak: {details.consecutiveFeverFreeDays ?? 0} day{details.consecutiveFeverFreeDays === 1 ? '' : 's'} fever-free
            </div>
          </div>
        );
      case 'TEMPERATURE_CORRECTED':
        return (
          <div className="space-y-0.5">
            <div className="font-semibold text-amber-800 flex items-center gap-1.5">
              <span>{details.previousTemperature}°C</span>
              <span>&rarr;</span>
              <span className="font-bold text-slate-900">{details.newTemperature}°C</span>
              {details.recordDate && (
                <span className="text-slate-500 font-normal">({formatDisplayDate(details.recordDate)})</span>
              )}
            </div>
            {details.reason && (
              <div className="text-[11px] text-slate-600 italic">
                Reason: &ldquo;{details.reason}&rdquo;
              </div>
            )}
          </div>
        );
      case 'DOCTOR_VISIT_COMPLETED':
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                Status: <span className="font-bold text-slate-900">{details.conditionSeverity || 'Evaluated'}</span>
              </span>
              {details.visitDate && (
                <span className="text-[11px] text-slate-500 font-mono">
                  ({formatDisplayDate(details.visitDate)})
                </span>
              )}
            </div>
            {details.observationsSnippet && (
              <div className="text-[11px] text-slate-600 truncate max-w-sm" title={details.observationsSnippet}>
                Assessment: &ldquo;{details.observationsSnippet}&rdquo;
              </div>
            )}
          </div>
        );
      case 'PATIENT_DISCHARGED':
        return (
          <div className="space-y-0.5">
            <div className="font-semibold text-purple-900">
              Discharge Confirmed
              {details.freedRoom ? ` • Released Room ${details.freedRoom}` : ''}
            </div>
            {details.dischargeDate && (
              <div className="text-[11px] text-slate-500">
                Discharged on {formatDisplayDate(details.dischargeDate)}
              </div>
            )}
          </div>
        );
      case 'PATIENT_DECEASED':
        return (
          <div className="space-y-0.5">
            <div className="font-semibold text-rose-900">
              Patient Deceased
              {details.vacatedRoom ? ` • Vacated Room ${details.vacatedRoom}` : ''}
            </div>
            {details.deathDate && (
              <div className="text-[11px] text-slate-500">
                Recorded on {formatDisplayDate(details.deathDate)}
              </div>
            )}
          </div>
        );
      case 'FEVER_THRESHOLD_UPDATED':
        return (
          <div className="space-y-0.5">
            <div className="font-semibold text-cyan-900">
              Fever Threshold: {details.previousThreshold}°C &rarr; {details.newThreshold}°C
            </div>
            {details.recalculatedPatientsCount !== undefined && (
              <div className="text-[11px] text-slate-500">
                {details.recalculatedPatientsCount} patient records recalculated
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {Object.entries(details).map(([key, value]) => (
              <span key={key} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                <span className="font-semibold text-slate-600">{key}:</span>
                <span>
                  {typeof value === 'string' && value.includes('T') && value.includes('-')
                    ? formatDisplayDate(value)
                    : String(value)}
                </span>
              </span>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          System & Clinical Audit Logs
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Immutable event log of all patient registrations, temperature entries and corrections, doctor visits, and discharge events.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchPatient}
            onChange={(e) => setSearchPatient(e.target.value)}
            placeholder="Search by Patient ID (e.g. VC-001)..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
          >
            <option value="">All Actions</option>
            <option value="PATIENT_REGISTERED">Patient Registered</option>
            <option value="TEMPERATURE_RECORDED">Temperature Recorded</option>
            <option value="TEMPERATURE_CORRECTED">Temperature Corrected</option>
            <option value="DOCTOR_VISIT_COMPLETED">Doctor Visit</option>
            <option value="PATIENT_DISCHARGED">Patient Discharged</option>
            <option value="PATIENT_DECEASED">Patient Deceased</option>
            <option value="FEVER_THRESHOLD_UPDATED">Fever Threshold Updated</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No audit log records found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Actor / Staff</th>
                  <th className="px-5 py-3">Patient ID</th>
                  <th className="px-5 py-3">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{log.userName}</span>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-900">
                      {log.patientId || 'System'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 text-xs max-w-md">
                      {renderEventDetails(log)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
