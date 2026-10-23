import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import MetricCard from '../components/MetricCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Users,
  CheckCircle2,
  Skull,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Stethoscope,
  Info,
  Calendar,
} from 'lucide-react';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/analytics');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Could not retrieve analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

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
        <h3>{error || 'Analytics not available.'}</h3>
      </div>
    );
  }

  const { summary, epidemiology, trends, statusDistribution } = data;
  const benchmark = epidemiology?.benchmark;
  const closedCohort = epidemiology?.closedCasesCohort;
  const allCohort = epidemiology?.allAdmittedCohort;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Epidemiological & Facility Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Clinical outcomes, benchmark comparisons, and daily operational compliance.
        </p>
      </div>

      {/* Benchmark Alert Card (if exceeding 15%) */}
      {benchmark && (
        <div
          className={`rounded-xl border p-5 shadow-sm ${
            benchmark.exceedsBenchmark
              ? 'border-rose-300 bg-rose-50/90 text-rose-900'
              : 'border-emerald-300 bg-emerald-50/70 text-emerald-900'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-2.5 rounded-lg ${
                benchmark.exceedsBenchmark ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  {benchmark.exceedsBenchmark
                    ? 'CRITICAL ALERT: Mortality Rate Exceeds Facility Benchmark'
                    : 'Mortality Rate Within Expected Operational Benchmark'}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    benchmark.exceedsBenchmark ? 'bg-rose-200 text-rose-900' : 'bg-emerald-200 text-emerald-900'
                  }`}
                >
                  Benchmark: {benchmark.expectedMortalityRate}%
                </span>
              </div>
              <p className="text-xs mt-1.5 leading-relaxed">
                {benchmark.alertMessage}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold">
                <span>Observed Mortality: <strong>{benchmark.observedMortalityRate}%</strong></span>
                <span>Expected Benchmark: <strong>{benchmark.expectedMortalityRate}%</strong></span>
                <span>
                  Variance:{' '}
                  <strong className={benchmark.variance > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                    {benchmark.variance > 0 ? `+${benchmark.variance}%` : `${benchmark.variance}%`}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Admitted Patients"
          value={summary.totalAdmitted}
          subtitle={`Current active census (Cap: ${summary.maxCapacity})`}
          icon={Users}
          color="blue"
        />

        <MetricCard
          title="Total Discharged"
          value={summary.totalDischarged}
          subtitle="Cleared after 3 afebrile days"
          icon={CheckCircle2}
          color="emerald"
        />

        <MetricCard
          title="Total Deaths"
          value={summary.totalDeaths}
          subtitle="Deceased outcome records"
          icon={Skull}
          color="rose"
        />

        <MetricCard
          title="Mortality Rate"
          value={`${closedCohort.mortalityRate}%`}
          subtitle="Closed Cases Denominator"
          icon={Skull}
          color={benchmark?.exceedsBenchmark ? 'rose' : 'slate'}
          alert={benchmark?.exceedsBenchmark}
        />

        <MetricCard
          title="Survival Rate"
          value={`${closedCohort.survivalRate}%`}
          subtitle="Closed Cases Denominator"
          icon={TrendingUp}
          color="emerald"
        />

        <MetricCard
          title="Temp Check Compliance"
          value={`${summary.tempCompletionRate}%`}
          subtitle={`${summary.todayCompletedTempChecks}/${summary.totalAdmitted} Completed Today`}
          icon={FileCheck}
          color="blue"
        />

        <MetricCard
          title="Doctor Visit Compliance"
          value={`${summary.visitCompletionRate}%`}
          subtitle={`${summary.todayCompletedDoctorVisits}/${summary.totalAdmitted} Completed Today`}
          icon={Stethoscope}
          color="emerald"
        />

        <MetricCard
          title="Bed Occupancy Rate"
          value={`${summary.occupancyRate}%`}
          subtitle={`${summary.occupiedBeds} of 74 Beds Occupied`}
          icon={Users}
          color={summary.occupiedBeds >= 70 ? 'rose' : 'indigo'}
        />
      </div>


      {/* Charts Section: 7-Day Trend & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Clinical Rounds Trend Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            7-Day Operational Activity & Fever Detections
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Daily temperature checks completed, fevers identified, and doctor visits.
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="tempChecks" name="Temp Checks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="doctorVisits" name="Doctor Visits" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="feversDetected" name="Fevers Detected" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Facility Census Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Breakdown by active and resolved patient outcomes.
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {statusDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
