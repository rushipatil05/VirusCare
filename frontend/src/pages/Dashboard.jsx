import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import {
  Users, BedDouble, Bed, Stethoscope, CheckCircle2, Skull,
  TrendingUp, AlertTriangle, ArrowRight, PlusCircle, Thermometer,
  ShieldCheck, HeartPulse, Activity,
} from 'lucide-react';

const Spinner = () => (
  <div className="flex min-h-[400px] items-center justify-center">
    <div className="h-6 w-6 animate-spin rounded border-2 border-teal-600 border-t-transparent" />
  </div>
);

const SectionHeader = ({ children, action }) => (
  <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200">
    <h3 className="text-[11px] font-bold uppercase tracking-widest text-stone-500">{children}</h3>
    {action}
  </div>
);

const ProgressBar = ({ pct, color = 'bg-teal-500', label, sub }) => (
  <div>
    <div className="flex justify-between text-[12px] mb-1">
      <span className="font-semibold text-stone-700">{label}</span>
      <span className="text-stone-500">{sub}</span>
    </div>
    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  </div>
);

// ─── ADMIN ────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [eligible, setEligible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([
      axiosClient.get('/analytics'),
      axiosClient.get('/discharges/eligible'),
    ]).then(([a, e]) => {
      setData(a.data.data);
      setEligible(e.data.eligiblePatients || []);
    }).catch(() => setError('Failed to load dashboard.')).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error || !data) return <div className="p-6 text-rose-600 text-sm">{error || 'No data.'}</div>;

  const { summary, epidemiology } = data;
  const alert = epidemiology?.benchmark?.exceedsBenchmark;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Administration Overview</h1>
          <p className="text-stone-500 text-sm mt-0.5">Facility status, bed management, discharge queue and clinical compliance.</p>
        </div>
        <button onClick={() => navigate('/patients')} className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Register Patient
        </button>
      </div>

      {/* Mortality alert
      {alert && (
        <div className="flex items-start gap-3 border border-rose-300 bg-rose-50 rounded-lg p-4 text-sm text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Mortality Benchmark Exceeded ({epidemiology.benchmark.observedMortalityRate}%)</strong>
            <p className="text-xs text-rose-600 mt-0.5">{epidemiology.benchmark.alertMessage}</p>
          </div>
          <button onClick={() => navigate('/analytics')} className="ml-auto text-xs font-semibold text-rose-700 hover:underline whitespace-nowrap">
            View Analytics →
          </button>
        </div>
      )} */}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Admitted" value={summary.totalAdmitted} subtitle={`${summary.occupancyRate}% occupancy`} icon={Users} color="teal" onClick={() => navigate('/patients')} />
        <MetricCard title="Beds Occupied" value={`${summary.occupiedBeds} / 74`} subtitle={`${summary.availableBeds} available`} icon={BedDouble} color="amber" onClick={() => navigate('/patients')} />
        <MetricCard title="Discharge Queue" value={summary.eligibleForDischarge} subtitle="3-day criterion met" icon={CheckCircle2} color={summary.eligibleForDischarge > 0 ? 'teal' : 'stone'} alert={summary.eligibleForDischarge > 0} onClick={() => navigate('/discharges')} />
        <MetricCard title="Total Deaths" value={summary.totalDeaths} subtitle={`${epidemiology.closedCasesCohort.mortalityRate}% case fatality`} icon={Skull} color={alert ? 'rose' : 'stone'} alert={alert} onClick={() => navigate('/analytics')} />
        <MetricCard title="Temp Checks" value={`${summary.todayCompletedTempChecks} / ${summary.totalAdmitted}`} subtitle={`${summary.tempCompletionRate}% today`} icon={Thermometer} color="sky" />
        <MetricCard title="Doctor Rounds" value={`${summary.todayCompletedDoctorVisits} / ${summary.totalAdmitted}`} subtitle={`${summary.visitCompletionRate}% today`} icon={Stethoscope} color="sky" />
        <MetricCard title="Survival Rate" value={`${epidemiology.closedCasesCohort.survivalRate}%`} subtitle={`${summary.totalDischarged} discharged`} icon={TrendingUp} color="teal" onClick={() => navigate('/analytics')} />
        <MetricCard title="Free Beds" value={summary.availableBeds} subtitle="of 74 total capacity" icon={Bed} color="stone" />
      </div>

      {/* Two-column row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Discharge queue */}
        <div className="lg:col-span-3 vc-card">
          <div className="vc-card-header">
            <span className="vc-card-title">Discharge Clearance Queue</span>
            <button onClick={() => navigate('/discharges')} className="text-[12px] text-teal-600 font-semibold hover:underline">
              Manage All →
            </button>
          </div>
          <div className="p-4">
            {eligible.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-6">No patients meet the 3-day fever-free criterion yet.</p>
            ) : (
              <table className="w-full vc-table text-xs">
                <thead><tr><th>Patient</th><th>Room</th><th>Streak</th><th className="text-right pr-2">Action</th></tr></thead>
                <tbody>
                  {eligible.map(({ patient, consecutiveFeverFreeDays }) => (
                    <tr key={patient._id}>
                      <td>
                        <div className="font-semibold text-stone-900">{patient.name}</div>
                        <div className="text-stone-400 text-[11px]">{patient.patientId}</div>
                      </td>
                      <td className="font-mono text-stone-600">Rm {patient.roomNumber}</td>
                      <td><span className="text-teal-700 font-bold">✓ {consecutiveFeverFreeDays}/3 days</span></td>
                      <td className="text-right pr-2">
                        <button onClick={() => navigate('/discharges')} className="px-2.5 py-1 bg-teal-600 text-white text-[11px] font-bold rounded hover:bg-teal-700 transition">
                          Discharge
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Compliance + Beds */}
        <div className="lg:col-span-2 space-y-4">
          <div className="vc-card p-4 space-y-4">
            <SectionHeader>Today's Compliance</SectionHeader>
            <ProgressBar label="Temperature Checks" pct={summary.tempCompletionRate} sub={`${summary.todayCompletedTempChecks}/${summary.totalAdmitted}`} color="bg-sky-500" />
            <ProgressBar label="Doctor Rounds" pct={summary.visitCompletionRate} sub={`${summary.todayCompletedDoctorVisits}/${summary.totalAdmitted}`} color="bg-teal-500" />
          </div>
          <div className="vc-card p-4">
            <SectionHeader>Bed Utilisation</SectionHeader>
            <ProgressBar label={`${summary.occupiedBeds} occupied`} pct={Number(summary.occupancyRate)} sub={`${summary.availableBeds} free`} color={summary.occupiedBeds >= 70 ? 'bg-rose-500' : 'bg-amber-500'} />
            <p className="text-[11px] text-stone-400 mt-2">Hard cap: 74 beds · Rooms released immediately on discharge</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DOCTOR ───────────────────────────────────────────────────────────────────
const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visits, setVisits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get('/doctor-visits/today').then(r => setVisits(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const doctorName = user?.name?.replace(' (Doctor)', '');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Daily Rounds — {doctorName}</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {visits?.pendingCount
              ? `${visits.pendingCount} patient${visits.pendingCount > 1 ? 's' : ''} awaiting review today.`
              : 'All rounds completed for today.'}
          </p>
        </div>
        <button onClick={() => navigate('/doctor-visits')} className="btn-primary">
          <Stethoscope className="w-4 h-4" />
          Open Rounds
        </button>
      </div>

      {/* Doctor KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard title="Pending Visits" value={visits?.pendingCount ?? '—'} subtitle="not yet reviewed today" icon={Stethoscope} color={visits?.pendingCount > 0 ? 'amber' : 'teal'} />
        <MetricCard title="Completed" value={visits?.completedCount ?? '—'} subtitle="evaluations documented" icon={CheckCircle2} color="teal" />
        <MetricCard title="Completion Rate" value={`${visits?.completionRate ?? 0}%`} subtitle="daily rounds compliance" icon={Activity} color="sky" />
      </div>

      {/* Pending table */}
      <div className="vc-card">
        <div className="vc-card-header">
          <span className="vc-card-title">Patients Pending Visit ({visits?.pendingCount ?? 0})</span>
          <button onClick={() => navigate('/doctor-visits')} className="text-[12px] text-teal-600 font-semibold hover:underline">
            Go to Rounds →
          </button>
        </div>
        {!visits?.pending?.length ? (
          <p className="text-stone-400 text-sm text-center py-8">All rounds completed — nothing pending.</p>
        ) : (
          <table className="w-full vc-table text-xs">
            <thead><tr><th>Patient</th><th>Room</th><th>Today's Temp</th><th>Fever-Free Streak</th><th className="text-right pr-2">Action</th></tr></thead>
            <tbody>
              {visits.pending.map(({ patient, hasTemperatureToday, todayTemperature, todayFever }) => (
                <tr key={patient._id}>
                  <td>
                    <div className="font-semibold text-stone-900">{patient.name}</div>
                    <div className="text-stone-400 text-[11px]">{patient.patientId}</div>
                  </td>
                  <td className="font-mono text-stone-600">Rm {patient.roomNumber}</td>
                  <td>
                    {hasTemperatureToday
                      ? <span className={`font-bold ${todayFever ? 'text-amber-700' : 'text-teal-700'}`}>{todayTemperature}°C {todayFever ? '⚠' : '✓'}</span>
                      : <span className="text-stone-400 italic text-[11px]">Not recorded</span>}
                  </td>
                  <td className="font-mono text-stone-600">{patient.consecutiveFeverFreeDays || 0} / 3</td>
                  <td className="text-right pr-2">
                    <button onClick={() => navigate(`/patients/${patient._id}`)} className="text-teal-600 text-[12px] font-semibold hover:underline">
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Completed */}
      {visits?.completed?.length > 0 && (
        <div className="vc-card">
          <div className="vc-card-header">
            <span className="vc-card-title">Completed Today ({visits.completedCount})</span>
          </div>
          <table className="w-full vc-table text-xs">
            <thead><tr><th>Patient</th><th>Room</th><th>Condition</th><th>Observations</th></tr></thead>
            <tbody>
              {visits.completed.map(({ patient, visit }) => (
                <tr key={visit._id}>
                  <td className="font-semibold text-stone-900">{patient.name}</td>
                  <td className="font-mono text-stone-500">Rm {patient.roomNumber}</td>
                  <td><StatusBadge status={visit.conditionSeverity} /></td>
                  <td className="text-stone-500 italic max-w-xs truncate">{visit.observations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── NURSE ────────────────────────────────────────────────────────────────────
const NurseDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [today, setToday]   = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosClient.get('/temperatures/today'),
      axiosClient.get('/config'),
    ]).then(([t, c]) => {
      setToday(t.data);
      setConfig(c.data.config);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const nurseName = user?.name?.replace(' (Nurse)', '');
  const threshold = config?.feverThreshold || 38.0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Temperature Rounds — {nurseName}</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Fever threshold: {threshold}°C ·{' '}
            {today?.pendingCount ? `${today.pendingCount} readings still pending.` : 'All readings complete for today.'}
          </p>
        </div>
        <button onClick={() => navigate('/temperatures')} className="btn-primary">
          <Thermometer className="w-4 h-4" />
          Record Temperature
        </button>
      </div>

      {/* Nurse KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard title="Pending" value={today?.pendingCount ?? '—'} subtitle="readings due today" icon={Thermometer} color={today?.pendingCount > 0 ? 'amber' : 'teal'} />
        <MetricCard title="Completed" value={today?.completedCount ?? '—'} subtitle="readings recorded" icon={CheckCircle2} color="teal" />
        <MetricCard title="Rate" value={`${today?.completionRate ?? 0}%`} subtitle="completion today" icon={Activity} color="sky" />
      </div>

      {/* Pending checks */}
      <div className="vc-card">
        <div className="vc-card-header">
          <span className="vc-card-title">Pending Temperature Checks ({today?.pendingCount ?? 0})</span>
          <button onClick={() => navigate('/temperatures')} className="text-[12px] text-teal-600 font-semibold hover:underline">
            Go to Records →
          </button>
        </div>
        {!today?.pending?.length ? (
          <p className="text-stone-400 text-sm text-center py-8">All temperature checks are done for today.</p>
        ) : (
          <table className="w-full vc-table text-xs">
            <thead><tr><th>Patient</th><th>Room</th><th>Age / Sex</th><th>Fever-Free Streak</th><th className="text-right pr-2">Action</th></tr></thead>
            <tbody>
              {today.pending.map(({ patient }) => (
                <tr key={patient._id}>
                  <td>
                    <div className="font-semibold text-stone-900">{patient.name}</div>
                    <div className="text-stone-400 text-[11px]">{patient.patientId}</div>
                  </td>
                  <td className="font-mono text-stone-600">Rm {patient.roomNumber}</td>
                  <td className="text-stone-500">{patient.age}y · {patient.gender}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 bg-stone-100 rounded-full border border-stone-200">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${((patient.consecutiveFeverFreeDays || 0) / 3) * 100}%` }} />
                      </div>
                      <span className="text-stone-500 font-mono">{patient.consecutiveFeverFreeDays || 0}/3</span>
                    </div>
                  </td>
                  <td className="text-right pr-2">
                    <button onClick={() => navigate('/temperatures')} className="px-2.5 py-1 bg-teal-600 text-white text-[11px] font-bold rounded hover:bg-teal-700 transition">
                      Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Today's done */}
      {today?.completed?.length > 0 && (
        <div className="vc-card">
          <div className="vc-card-header">
            <span className="vc-card-title">Recorded Today ({today.completedCount})</span>
          </div>
          <table className="w-full vc-table text-xs">
            <thead><tr><th>Patient</th><th>Room</th><th>Temperature</th><th>Evaluation</th><th>Notes</th></tr></thead>
            <tbody>
              {today.completed.map(({ patient, record }) => (
                <tr key={record._id}>
                  <td className="font-semibold text-stone-900">{patient.name}</td>
                  <td className="font-mono text-stone-500">Rm {patient.roomNumber}</td>
                  <td className="font-bold font-mono text-stone-800">{record.temperature}°C</td>
                  <td><StatusBadge status={record.isFever ? 'Fever Detected' : 'Afebrile'} /></td>
                  <td className="text-stone-400 italic max-w-[160px] truncate">{record.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── EXPORT ───────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { role } = useAuth();
  if (role === 'admin')  return <AdminDashboard />;
  if (role === 'doctor') return <DoctorDashboard />;
  return <NurseDashboard />;
};

export default Dashboard;
