import React, { useState, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Clock, CalendarDays, TrendingUp } from 'lucide-react';
import AdminDatePicker from '../AdminDatePicker';

const ROLE_COLORS = {
  'Super Admin':       '#10b981',
  'Zoo Manager':       '#0891b2',
  'Caretaker':         '#3b82f6',
  'Event Coordinator': '#a855f7',
  'Ticket Staff':      '#eab308',
  'Shop Manager':      '#ea580c',
  'Maintenance':       '#ef4444',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRESETS = [
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: '6m',  label: 'Last 6 Months' },
  { id: '1y', label: 'Last 12 Months' },
  { id: 'custom', label: 'Custom' },
];

const PRESET_SUB = { '30d': 'last 30 days', '90d': 'last 90 days', '6m': 'last 6 months', '1y': 'last 12 months', 'custom': 'custom range' };

const getPresetRange = (preset) => {
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  if (preset === '90d') { const s = new Date(now); s.setDate(s.getDate() - 90); return { start: new Date(s.getTime() - s.getTimezoneOffset() * 60000).toISOString().split('T')[0], end: today }; }
  if (preset === '6m')  { const s = new Date(now); s.setMonth(s.getMonth() - 6); return { start: new Date(s.getTime() - s.getTimezoneOffset() * 60000).toISOString().split('T')[0], end: today }; }
  if (preset === '1y')  { const s = new Date(now); s.setFullYear(s.getFullYear() - 1); return { start: new Date(s.getTime() - s.getTimezoneOffset() * 60000).toISOString().split('T')[0], end: today }; }
  const s = new Date(now); s.setDate(s.getDate() - 30);
  return { start: new Date(s.getTime() - s.getTimezoneOffset() * 60000).toISOString().split('T')[0], end: today };
};

const TODAY = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];



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

function shiftDuration(start, end) {
  const parse = (t) => {
    if (!t) return null;
    let timeStr = t;
    if (t.includes('T')) timeStr = t.split('T')[1]?.substring(0, 5) || t;
    const [h, m] = timeStr.substring(0, 5).split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h + m / 60;
  };
  const s = parse(start);
  const e = parse(end);
  if (s === null || e === null || e <= s) return 0;
  return Math.round((e - s) * 100) / 100;
}

const StaffReportOverview = ({ staffList, schedules, assignments }) => {
  const [preset,      setPreset]      = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [animKey, setAnimKey] = useState(0);

  const handlePreset = useCallback((id) => {
    setPreset(id);
    setAnimKey(k => k + 1);
  }, []);
  const handleCustomStart = useCallback((v) => {
    setCustomStart(v);
    setAnimKey(k => k + 1);
  }, []);
  const handleCustomEnd = useCallback((v) => {
    setCustomEnd(v);
    setAnimKey(k => k + 1);
  }, []);

  // Compute date range from preset
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (preset === 'custom') {
      return { rangeStart: customStart || '', rangeEnd: customEnd || '' };
    }
    const { start, end } = getPresetRange(preset);
    return { rangeStart: start, rangeEnd: end };
  }, [preset, customStart, customEnd]);

  // Filter schedules by date range
  const filteredSchedules = useMemo(() => {
    if (!rangeStart && !rangeEnd) return schedules;
    return schedules.filter(sh => {
      if (!sh.WorkDate) return false;
      const d = sh.WorkDate.includes('T') ? sh.WorkDate.split('T')[0] : sh.WorkDate;
      if (rangeStart && d < rangeStart) return false;
      if (rangeEnd && d > rangeEnd) return false;
      return true;
    });
  }, [schedules, rangeStart, rangeEnd]);

  // ── Role Distribution (pie) — not date-filtered (headcount)
  const roleData = useMemo(() => {
    const counts = {};
    for (const s of staffList) {
      const r = s.Role || 'Unknown';
      counts[r] = (counts[r] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [staffList]);

  // ── Hours by Role (bar) — date-filtered
  const hoursByRole = useMemo(() => {
    const staffRoleMap = {};
    for (const s of staffList) staffRoleMap[s.StaffID] = s.Role || 'Unknown';
    const hours = {};
    for (const sh of filteredSchedules) {
      const role = staffRoleMap[sh.StaffID] || 'Unknown';
      hours[role] = (hours[role] || 0) + shiftDuration(sh.ShiftStart, sh.ShiftEnd);
    }
    return Object.entries(hours).map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 })).sort((a, b) => b.value - a.value);
  }, [staffList, filteredSchedules]);

  // ── Shifts by Day of Week (bar) — date-filtered
  const shiftsByDay = useMemo(() => {
    const counts = new Array(7).fill(0);
    for (const sh of filteredSchedules) {
      if (!sh.WorkDate) continue;
      const dateStr = sh.WorkDate.includes('T') ? sh.WorkDate.split('T')[0] : sh.WorkDate;
      const d = new Date(dateStr + 'T00:00:00');
      if (!isNaN(d.getTime())) counts[d.getDay()]++;
    }
    return DAY_NAMES.map((name, i) => ({ name, value: counts[i] }));
  }, [filteredSchedules]);



  // ── Top 5 Employees by Hours — date-filtered
  const topEmployees = useMemo(() => {
    const hoursMap = {};
    const shiftsMap = {};
    for (const sh of filteredSchedules) {
      hoursMap[sh.StaffID] = (hoursMap[sh.StaffID] || 0) + shiftDuration(sh.ShiftStart, sh.ShiftEnd);
      shiftsMap[sh.StaffID] = (shiftsMap[sh.StaffID] || 0) + 1;
    }
    return staffList
      .map(s => ({
        name: `${s.FirstName} ${s.LastName}`,
        role: s.Role,
        hours: Math.round((hoursMap[s.StaffID] || 0) * 10) / 10,
        shifts: shiftsMap[s.StaffID] || 0,
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
  }, [staffList, filteredSchedules]);

  // ── KPI stats — date-filtered
  const totalStaff = staffList.length;
  const totalShifts = filteredSchedules.length;
  const totalHours = useMemo(() => {
    let h = 0;
    for (const sh of filteredSchedules) h += shiftDuration(sh.ShiftStart, sh.ShiftEnd);
    return Math.round(h * 10) / 10;
  }, [filteredSchedules]);
  const avgHoursPerShift = totalShifts > 0 ? (totalHours / totalShifts).toFixed(1) : '0';


  const rangeSub = PRESET_SUB[preset] || 'in range';

  const thStyle = { padding: '8px 12px', textAlign: 'left', color: 'var(--adm-text-secondary)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div className="ov-root">
      {/* ── Date range bar ── */}
      <div className="ov-date-bar">
        <div className="ov-preset-btns">
          {PRESETS.map(p => (
            <button
              key={p.id}
              className={`ov-preset-btn${preset === p.id ? ' active' : ''}`}
              onClick={() => handlePreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="ov-custom-range">
            <AdminDatePicker value={customStart} onChange={handleCustomStart} placeholder="Start date" maxDate={customEnd || TODAY} />
            <span className="ov-range-sep">to</span>
            <AdminDatePicker value={customEnd} onChange={handleCustomEnd} placeholder="End date" minDate={customStart || undefined} maxDate={TODAY} />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="ov-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KpiCard icon={<Users size={16} color="#6366f1" />} label="Total Employees" value={totalStaff} sub="active staff" />
        <KpiCard icon={<CalendarDays size={16} color="#3b82f6" />} label="Total Shifts" value={totalShifts.toLocaleString()} sub={rangeSub} accent />
        <KpiCard icon={<Clock size={16} color="#10b981" />} label="Total Hours" value={`${totalHours.toLocaleString()} hrs`} sub={rangeSub} />
        <KpiCard icon={<TrendingUp size={16} color="#f59e0b" />} label="Avg Hours/Shift" value={`${avgHoursPerShift} hrs`} sub="per shift" />
      </div>

      {/* Row 1: Role Distribution + Hours by Role */}
      <div className="ov-charts-row" key={`row1-${animKey}`}>
        <div className="ov-chart-card">
          <p className="ov-chart-title">Staff by Role</p>
          <p className="ov-chart-sub">Distribution of employees across roles</p>
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                  {roleData.map((d, i) => <Cell key={i} fill={ROLE_COLORS[d.name] || '#6b7280'} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(136,136,136,0.15)' }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value, entry) => (
                    <span style={{ color: 'var(--adm-text-secondary)', fontSize: '0.75rem' }}>
                      {value} <strong style={{ color: 'var(--adm-text-primary)' }}>{entry.payload.value}</strong>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="ov-no-data">No role data</div>}
        </div>

        <div className="ov-chart-card">
          <p className="ov-chart-title">Hours by Role</p>
          <p className="ov-chart-sub">Total scheduled hours per role</p>
          {hoursByRole.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={hoursByRole} margin={{ left: 0, right: 20, bottom: 40 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--adm-text-secondary)', fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: 'var(--adm-text-secondary)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(136,136,136,0.15)' }} />
                <Bar dataKey="value" name="Hours" fill="#0891b2" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="ov-no-data">No shift data</div>}
        </div>
      </div>

      {/* Row 2: Shifts by Day of Week (full width) */}
      <div className="ov-charts-row" key={`row2-${animKey}`} style={{ gridTemplateColumns: '1fr' }}>
        <div className="ov-chart-card">
          <p className="ov-chart-title">Shifts by Day of Week</p>
          <p className="ov-chart-sub">Shift distribution across weekdays</p>
          {shiftsByDay.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={shiftsByDay} margin={{ left: 0, right: 20 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--adm-text-secondary)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--adm-text-secondary)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(136,136,136,0.15)' }} />
                <Bar dataKey="value" name="Shifts" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="ov-no-data">No schedule data</div>}
        </div>
      </div>

      {/* Top 5 Employees by Hours */}
      {topEmployees.length > 0 && (
        <div className="ov-chart-card" style={{ marginTop: 4 }}>
          <p className="ov-chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color="#f59e0b" /> Top Employees by Hours
          </p>
          <p className="ov-chart-sub">Highest scheduled hours in selected period</p>
          <div style={{ border: '1px solid var(--adm-border)', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: 'var(--adm-bg-surface)' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Employee</th>
                  <th style={thStyle}>Role</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Shifts</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {topEmployees.map((emp, i) => {
                  const rc = ROLE_COLORS[emp.role] || '#6b7280';
                  return (
                    <tr key={i} style={{ borderTop: '1px solid var(--adm-border)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--adm-text-muted)' }}>{i + 1}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--adm-text-primary, #fff)' }}>{emp.name}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: rc + '22', color: rc }}>
                          {emp.role}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--adm-text-secondary)' }}>{emp.shifts}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--adm-text-primary, #fff)' }}>{emp.hours} hrs</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffReportOverview;
