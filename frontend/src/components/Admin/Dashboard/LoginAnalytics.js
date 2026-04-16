import { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart as LineChartIcon, Users, UserCheck, ShieldCheck, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../../services/apiClient';
import AdminSelect from '../AdminSelect';
import AdminDatePicker from '../AdminDatePicker';
import '../AdminTable.css';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
  AreaChart, Area,
} from 'recharts';

/* ── Colours ─────────────────────────────────────────── */
const roleColorMap = {
  'Super Admin':       '#10b981',
  'Zoo Manager':       '#0891b2',
  'Caretaker':         '#3b82f6',
  'Event Coordinator': '#a855f7',
  'Ticket Staff':      '#eab308',
  'Shop Manager':      '#f97316',
  'Maintenance':       '#ef4444',
};

const roleBgMap = Object.fromEntries(
  Object.entries(roleColorMap).map(([k, v]) => [k, v + '22'])
);

const CHART_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f97316', '#0891b2', '#eab308', '#ef4444', '#6366f1'];

const RANGE_OPTIONS = [
  { value: 'today',  label: 'Today' },
  { value: 'week',   label: 'This Week' },
  { value: 'month',  label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

function getDateRange(range) {
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  if (range === 'today') return { start: fmt(today), end: fmt(today) };
  if (range === 'week') {
    const mon = new Date(today); mon.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    return { start: fmt(mon), end: fmt(today) };
  }
  if (range === 'month') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: fmt(first), end: fmt(today) };
  }
  return null;
}

/* ── Custom Recharts tooltip ─────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--adm-bg-surface-2)', border: '1px solid var(--adm-border)',
      borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem',
    }}>
      <p style={{ margin: 0, fontWeight: 700, color: 'var(--adm-text-primary)', marginBottom: 4 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ margin: 0, color: entry.color || entry.fill, fontSize: '0.78rem' }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ── Donut centre label ──────────────────────────────── */
const DonutCenterLabel = ({ viewBox, total }) => {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  if (!cx && !cy) return null;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-6" style={{ fontSize: '1.4rem', fontWeight: 800, fill: 'var(--adm-text-primary)' }}>{total}</tspan>
      <tspan x={cx} dy="18" style={{ fontSize: '0.65rem', fontWeight: 600, fill: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>logins</tspan>
    </text>
  );
};

/* ══════════════════════════════════════════════════════ */
const LoginAnalytics = () => {
  const [stats, setStats] = useState({ staffLogins: [], customerLogins: [] });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const fetchAnalytics = useCallback(async (start, end) => {
    if (!start || !end) return;
    setLoading(true);
    try {
      const { auth } = await import('../../../services/firebase');
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(
        `${API_BASE_URL}/api/analytics/logins?startDate=${start}&endDate=${end}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load login analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (range !== 'custom') {
      const { start, end } = getDateRange(range);
      fetchAnalytics(start, end);
    } else if (customStart && customEnd) {
      fetchAnalytics(customStart, customEnd);
    }
  }, [range, customStart, customEnd, fetchAnalytics]);

  /* ── Derived chart data ─────────────────────────────── */
  const staffCount = stats.staffLogins?.length || 0;
  const custCount  = stats.customerLogins?.length || 0;
  const totalLogins = staffCount + custCount;

  // Unique staff members
  const uniqueStaff = useMemo(() => {
    const set = new Set();
    (stats.staffLogins || []).forEach(l => set.add(l.StaffID));
    return set.size;
  }, [stats.staffLogins]);

  // Unique customers
  const uniqueCustomers = useMemo(() => {
    const set = new Set();
    (stats.customerLogins || []).forEach(l => set.add(l.CustomerID));
    return set.size;
  }, [stats.customerLogins]);

  // Staff logins by role (donut)
  const roleData = useMemo(() => {
    const map = {};
    (stats.staffLogins || []).forEach(l => { map[l.Role] = (map[l.Role] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [stats.staffLogins]);

  // Activity timeline (bar chart) — group both types by hour or day
  const timelineData = useMemo(() => {
    const allLogins = [
      ...(stats.staffLogins || []).map(l => ({ time: l.LoginTime, type: 'staff' })),
      ...(stats.customerLogins || []).map(l => ({ time: l.LoginTime, type: 'customer' })),
    ];

    const isToday = range === 'today';

    if (isToday) {
      // Scaffold all 24 hours with zeros
      const buckets = Array.from({ length: 24 }, (_, h) => ({
        label: `${h.toString().padStart(2, '0')}:00`,
        staff: 0,
        customers: 0,
        _sortKey: h,
      }));
      allLogins.forEach(({ time, type }) => {
        const h = new Date(time).getHours();
        if (type === 'staff') buckets[h].staff++;
        else buckets[h].customers++;
      });
      return buckets;
    }

    // Non-today: group by day
    if (allLogins.length === 0) return [];
    const buckets = {};
    allLogins.forEach(({ time, type }) => {
      const d = new Date(time);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!buckets[key]) buckets[key] = { label: key, staff: 0, customers: 0, _sortKey: d.getTime() };
      if (type === 'staff') buckets[key].staff++;
      else buckets[key].customers++;
    });
    return Object.values(buckets).sort((a, b) => a._sortKey - b._sortKey);
  }, [stats, range]);

  // Top staff (most logins)
  const topStaff = useMemo(() => {
    const map = {};
    (stats.staffLogins || []).forEach(l => {
      const key = l.StaffID;
      if (!map[key]) map[key] = { name: `${l.FirstName} ${l.LastName}`, role: l.Role, count: 0 };
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [stats.staffLogins]);

  // Top customers (most active / returning)
  const topCustomers = useMemo(() => {
    const map = {};
    (stats.customerLogins || []).forEach(l => {
      const key = l.CustomerID;
      if (!map[key]) map[key] = { name: l.FullName, email: l.Email, count: 0 };
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [stats.customerLogins]);

  const formatDate = (d) => new Date(d).toLocaleString();

  /* ── Reusable inner components ─────────────────────── */
  const StatCard = ({ icon, label, value, accent }) => (
    <div style={{
      flex: 1, minWidth: 130, background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)',
      borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 4,
      borderLeft: `4px solid ${accent}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1, color: 'var(--adm-text-primary)' }}>{value}</span>
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--adm-text-secondary)' }}>{label}</span>
    </div>
  );

  const ChartPanel = ({ title, subtitle, children, style }) => (
    <div className="admin-table-container" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style }}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--adm-border)', background: 'var(--adm-bg-surface-2)', flexShrink: 0,
      }}>
        <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--adm-text-primary)' }}>{title}</h2>
        {subtitle && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--adm-text-secondary)' }}>{subtitle}</p>}
      </div>
      <div style={{ flex: 1, padding: '16px 12px', minHeight: 0 }}>
        {children}
      </div>
    </div>
  );

  const Panel = ({ title, count, children }) => (
    <div className="admin-table-container" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--adm-border)', background: 'var(--adm-bg-surface-2)',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--adm-text-primary)' }}>{title}</h2>
        {count != null && (
          <span style={{ fontSize: '0.8rem', color: 'var(--adm-text-secondary)' }}>
            {count} login{count !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>{children}</div>
    </div>
  );

  /* ══════════════════════════════════════════════════════ */
  return (
    <div className="admin-page">
      {/* ── Header ── */}
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title"><LineChartIcon size={26} className="title-icon" /> Login Analytics</h1>
          <p className="admin-page-subtitle">Recent login activity across staff and public users.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {range === 'custom' && (
            <>
              <AdminDatePicker value={customStart} onChange={setCustomStart} placeholder="Start date" maxDate={customEnd || today} />
              <span style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>to</span>
              <AdminDatePicker value={customEnd} onChange={setCustomEnd} placeholder="End date" minDate={customStart} maxDate={today} />
            </>
          )}
          <AdminSelect value={range} onChange={v => { setRange(v); setCustomStart(''); setCustomEnd(''); }} options={RANGE_OPTIONS} width="148px" />
        </div>
      </div>

      {loading ? (
        <div className="admin-table-container"><div className="admin-table-loading">Loading analytics...</div></div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
            <StatCard icon={<TrendingUp size={18} style={{ color: '#10b981' }} />} label="Total Logins" value={totalLogins} accent="#10b981" />
            <StatCard icon={<ShieldCheck size={18} style={{ color: '#3b82f6' }} />} label="Staff Logins" value={staffCount} accent="#3b82f6" />
            <StatCard icon={<Users size={18} style={{ color: '#a855f7' }} />} label="Public Logins" value={custCount} accent="#a855f7" />
            <StatCard icon={<UserCheck size={18} style={{ color: '#f97316' }} />} label="Unique Staff" value={uniqueStaff} accent="#f97316" />
            <StatCard icon={<UserCheck size={18} style={{ color: '#0891b2' }} />} label="Unique Visitors" value={uniqueCustomers} accent="#0891b2" />
          </div>

          {/* ── Charts row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Donut – Staff logins by role */}
            <ChartPanel title="Staff Logins by Role" subtitle="Share of staff logins by position">
              {roleData.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: 'var(--adm-text-secondary)', fontSize: '0.85rem' }}>No staff logins</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={95}
                      paddingAngle={3}
                      cornerRadius={4}
                      stroke="none"
                    >
                      {roleData.map((entry, i) => (
                        <Cell key={entry.name} fill={roleColorMap[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                      <DonutCenterLabel total={staffCount} />
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value, entry) => (
                        <span style={{ color: 'var(--adm-text-secondary)', fontSize: '0.75rem' }}>
                          {value} <strong style={{ color: 'var(--adm-text-primary)' }}>
                            {roleData.find(r => r.name === value)?.value || 0}
                          </strong>
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>

            {/* Bar chart – Login activity timeline */}
            <ChartPanel title="Login Activity" subtitle={range === 'today' ? 'Logins by hour' : 'Logins by day'}>
              {timelineData.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: 'var(--adm-text-secondary)', fontSize: '0.85rem' }}>No activity data</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={timelineData} margin={{ top: 8, right: 16, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="staffGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--adm-border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'var(--adm-text-secondary)', fontSize: 10 }}
                      axisLine={false} tickLine={false}
                      interval={range === 'today' ? 2 : 0}
                    />
                    <YAxis tick={{ fill: 'var(--adm-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone" dataKey="staff" name="Staff"
                      stroke="#3b82f6" strokeWidth={2.5}
                      dot={{ fill: '#3b82f6', r: 3.5, strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone" dataKey="customers" name="Customers"
                      stroke="#a855f7" strokeWidth={2.5}
                      dot={{ fill: '#a855f7', r: 3.5, strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: 'var(--adm-text-secondary)', fontSize: '0.75rem' }}>{v}</span>} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>
          </div>

          {/* ── Most active users row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Most active staff */}
            <ChartPanel title="Most Active Staff" subtitle="Top staff by login count">
              {topStaff.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: 'var(--adm-text-secondary)', fontSize: '0.85rem' }}>No staff logins</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topStaff.map((s, i) => {
                    const pct = staffCount > 0 ? Math.round((s.count / staffCount) * 100) : 0;
                    const barColor = roleColorMap[s.role] || CHART_COLORS[i];
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 22, textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', color: 'var(--adm-text-secondary)' }}>#{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--adm-text-primary)' }}>{s.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ padding: '1px 8px', borderRadius: 12, fontSize: '0.68rem', fontWeight: 600, background: roleBgMap[s.role] || '#333', color: roleColorMap[s.role] || '#888' }}>{s.role}</span>
                              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: barColor }}>{s.count}</span>
                            </div>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'var(--adm-bg-surface-2)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: barColor, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ChartPanel>

            {/* Most active / returning customers */}
            <ChartPanel title="Returning Visitors" subtitle="Most active public users">
              {topCustomers.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: 'var(--adm-text-secondary)', fontSize: '0.85rem' }}>No public logins</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topCustomers.map((c, i) => {
                    const pct = custCount > 0 ? Math.round((c.count / custCount) * 100) : 0;
                    const barColor = CHART_COLORS[i % CHART_COLORS.length];
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 22, textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', color: 'var(--adm-text-secondary)' }}>#{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--adm-text-primary)' }}>{c.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--adm-text-secondary)' }}>{c.email}</span>
                              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: barColor }}>{c.count}×</span>
                            </div>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'var(--adm-bg-surface-2)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: barColor, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ChartPanel>
          </div>

          {/* ── Detail tables ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Panel title="Recent Staff Logins" count={staffCount}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Role</th>
                    <th style={{ textAlign: 'left' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {staffCount === 0 && (
                    <tr><td colSpan="3" className="admin-table-empty" style={{ padding: '24px', textAlign: 'center' }}>No logins in this period.</td></tr>
                  )}
                  {(stats.staffLogins || []).map(log => (
                    <tr key={log.LogID}>
                      <td style={{ color: 'var(--adm-text-primary)', fontWeight: 500 }}>{log.FirstName} {log.LastName}</td>
                      <td>
                        {(() => { const c = roleColorMap[log.Role] || '#888'; const bg = roleBgMap[log.Role] || 'rgba(100,100,100,0.15)'; return (
                          <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: bg, color: c }}>
                            {log.Role}
                          </span>
                        ); })()}
                      </td>
                      <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem', textAlign: 'left' }}>{formatDate(log.LoginTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel title="Recent Public User Logins" count={custCount}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th style={{ textAlign: 'left' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {custCount === 0 && (
                    <tr><td colSpan="3" className="admin-table-empty" style={{ padding: '24px', textAlign: 'center' }}>No logins in this period.</td></tr>
                  )}
                  {(stats.customerLogins || []).map(log => (
                    <tr key={log.LogID}>
                      <td style={{ color: 'var(--adm-text-primary)', fontWeight: 500 }}>{log.FullName}</td>
                      <td style={{ color: 'var(--adm-text-secondary)' }}>{log.Email}</td>
                      <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem', textAlign: 'left' }}>{formatDate(log.LoginTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
};

export default LoginAnalytics;
