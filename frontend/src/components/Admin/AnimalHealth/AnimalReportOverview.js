import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PawPrint, HeartPulse, AlertTriangle, UtensilsCrossed, ShieldAlert, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAnimalReportSummary } from '../../../services/animalHealthService';
import { toast } from 'sonner';

const HEALTH_COLORS = { Excellent: '#10b981', Good: '#3b82f6', Fair: '#f59e0b', Critical: '#ef4444' };
const GENDER_COLORS = { Male: '#3b82f6', Female: '#ec4899' };

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) => {
  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="var(--adm-text-secondary)" textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central" fontSize={14} fontWeight={600}>
      {name} ({value})
    </text>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ov-tooltip">
      <p className="ov-tooltip-label">{label || payload[0]?.name}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color || p.fill }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const KpiCard = ({ icon, label, value, sub, accent }) => (
  <div className="ov-kpi-card" style={accent ? { borderColor: 'var(--adm-accent)', borderWidth: 2 } : undefined}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      {icon}
      <p className="ov-kpi-label">{label}</p>
    </div>
    <p className="ov-kpi-value" style={accent ? { color: 'var(--adm-accent)' } : undefined}>{value}</p>
    {sub && <p className="ov-kpi-sub">{sub}</p>}
  </div>
);

const thStyle = { padding: '8px 12px', textAlign: 'left', color: 'var(--adm-text-secondary)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' };

const AnimalReportOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAnimalReportSummary()
      .then(setData)
      .catch(err => toast.error(err.message || 'Failed to load summary.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="ov-loading">Loading overview...</div>;
  if (!data) return <div className="ov-no-data">No summary data available.</div>;

  const { stats, healthDistribution, exhibitDistribution, genderDistribution, endangeredDistribution, ageDistribution, recentAlerts, alertStatusDistribution } = data;
  const totalAnimals = stats?.TotalAnimals || 0;
  const avgScore = stats?.AvgHealthScore != null ? Math.round(stats.AvgHealthScore) : '—';
  const activeAlerts = stats?.UnresolvedAlerts || 0;
  const totalSchedules = stats?.TotalSchedules || 0;
  const activeKeepers = stats?.ActiveAssignments || 0;

  const healthData = (healthDistribution || []).map(d => ({ name: d.HealthStatus, value: d.Count }));
  const exhibitData = (exhibitDistribution || []).map(d => ({ name: d.ExhibitName, value: d.Count }));
  const genderData = (genderDistribution || []).map(d => ({ name: d.Gender, value: d.Count }));
  const ageData = (ageDistribution || []).map(d => ({ name: d.AgeRange + ' yrs', value: d.Count }));
  const endangeredData = endangeredDistribution ? [
    { name: 'Endangered', value: endangeredDistribution.Endangered || 0 },
    { name: 'Not Endangered', value: endangeredDistribution.NotEndangered || 0 },
  ] : [];
  const alertStatusData = alertStatusDistribution ? [
    { name: 'Active', value: alertStatusDistribution.Active || 0 },
    { name: 'Resolved', value: alertStatusDistribution.Resolved || 0 },
  ] : [];

  const visibleAlerts = (recentAlerts || []).slice(0, 5);

  return (
    <div className="ov-root">
      {/* KPI Cards */}
      <div className="ov-kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <KpiCard icon={<PawPrint size={16} color="#6366f1" />} label="Total Animals" value={totalAnimals} sub="in the zoo" />
        <KpiCard icon={<HeartPulse size={16} color="#10b981" />} label="Avg Health Score" value={avgScore} sub="out of 100" accent />
        <KpiCard icon={<AlertTriangle size={16} color="#ef4444" />} label="Active Alerts" value={activeAlerts} sub="unresolved" />
        <KpiCard icon={<UtensilsCrossed size={16} color="#f59e0b" />} label="Feeding Schedules" value={totalSchedules} sub="active schedules" />
        <KpiCard icon={<Users size={16} color="#3b82f6" />} label="Keeper Assignments" value={activeKeepers} sub="active assignments" />
      </div>

      {/* Row 1: Health Status Donut + Animals by Exhibit */}
      <div className="ov-charts-row">
        <div className="ov-chart-card">
          <p className="ov-chart-title">Health Status Distribution</p>
          <p className="ov-chart-sub">Current health status across all animals</p>
          {healthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={healthData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" label={renderCustomLabel} labelLine={false}>
                  {healthData.map((d, i) => <Cell key={i} fill={HEALTH_COLORS[d.name] || '#6b7280'} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(136,136,136,0.15)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="ov-no-data">No health data</div>}
        </div>

        <div className="ov-chart-card">
          <p className="ov-chart-title">Animals by Exhibit</p>
          <p className="ov-chart-sub">Distribution across exhibit locations</p>
          {exhibitData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={exhibitData} margin={{ left: 0, right: 20, bottom: 40 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--adm-text-secondary)', fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: 'var(--adm-text-secondary)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(136,136,136,0.15)' }} />
                <Bar dataKey="value" name="Animals" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="ov-no-data">No exhibit data</div>}
        </div>
      </div>

      {/* Row 2: Gender Distribution + Alerts Status */}
      <div className="ov-charts-row">
        <div className="ov-chart-card">
          <p className="ov-chart-title">Gender Distribution</p>
          <p className="ov-chart-sub">Male vs Female across the zoo</p>
          {genderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value" label={renderCustomLabel} labelLine={false}>
                  {genderData.map((d, i) => <Cell key={i} fill={GENDER_COLORS[d.name] || '#6b7280'} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(136,136,136,0.15)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="ov-no-data">No gender data</div>}
        </div>

        <div className="ov-chart-card">
          <p className="ov-chart-title">Alerts Status</p>
          <p className="ov-chart-sub">Active vs resolved health alerts</p>
          {alertStatusData.length > 0 && (alertStatusData[0].value > 0 || alertStatusData[1].value > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={alertStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value" label={renderCustomLabel} labelLine={false}>
                  <Cell fill="#ef4444" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(136,136,136,0.15)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="ov-no-data">No alert data</div>}
        </div>
      </div>

      {/* Row 3: Age Distribution + Endangered Status */}
      <div className="ov-charts-row">
        <div className="ov-chart-card">
          <p className="ov-chart-title">Age Distribution</p>
          <p className="ov-chart-sub">Animals grouped by age range</p>
          {ageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ageData} margin={{ left: 0, right: 20 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--adm-text-secondary)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--adm-text-secondary)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(136,136,136,0.15)' }} />
                <Bar dataKey="value" name="Animals" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="ov-no-data">No age data</div>}
        </div>

        <div className="ov-chart-card">
          <p className="ov-chart-title">Endangered Status</p>
          <p className="ov-chart-sub">Endangered vs non-endangered animals</p>
          {endangeredData.length > 0 && (endangeredData[0].value > 0 || endangeredData[1].value > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={endangeredData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value" label={renderCustomLabel} labelLine={false}>
                  <Cell fill="#ef4444" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(136,136,136,0.15)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="ov-no-data">No endangered data</div>}
        </div>
      </div>

      {/* Recent Active Alerts — collapsible */}
      {recentAlerts && recentAlerts.length > 0 && (
        <div className="ov-chart-card" style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="ov-chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={16} color="#ef4444" /> Recent Active Alerts
              </p>
              <p className="ov-chart-sub">Unresolved health alerts requiring attention</p>
            </div>
            <button onClick={() => navigate('/admin/animal-health', { state: { tab: 'alerts' } })}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7, border: '1px solid var(--adm-border)', background: 'var(--adm-bg-surface)', color: 'var(--adm-accent, #16a34a)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              View All Alerts <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ border: '1px solid var(--adm-border)', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: 'var(--adm-bg-surface)' }}>
                  <th style={thStyle}>Animal</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Message</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {visibleAlerts.map(al => (
                  <tr key={al.AlertID} style={{ borderTop: '1px solid var(--adm-border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{al.AnimalName} <span style={{ color: 'var(--adm-text-muted)', fontWeight: 400 }}>({al.Species})</span></td>
                    <td style={{ padding: '8px 12px', color: 'var(--adm-text-secondary)' }}>{al.AlertType}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--adm-text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{al.AlertMessage}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--adm-text-secondary)', whiteSpace: 'nowrap' }}>{al.CreatedAt ? new Date(al.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
};

export default AnimalReportOverview;
