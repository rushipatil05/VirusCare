import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { formatDateTime } from '../utils/dateFormatter';
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
                    <td className="px-5 py-3.5 text-slate-700 font-mono text-[11px] max-w-md break-words">
                      {JSON.stringify(log.details)}
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
