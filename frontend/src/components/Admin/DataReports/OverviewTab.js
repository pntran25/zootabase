import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { apiGet } from '../../../services/apiClient';
import { toast } from 'sonner';
import AdminDatePicker from '../AdminDatePicker';

const COLORS = {
  tickets:     '#3b82f6',
  memberships: '#10b981',
  giftShop:    '#f59e0b',
  events:      '#8b5cf6',
};

const fmtMoney    = (v) => `$${(Number(v) / 1000).toFixed(0)}k`;
const fmtKpi      = (v) => `$${Math.round(Number(v)).toLocaleString()}`;

const getPresetRange = (preset) => {
  const now   = new Date();
  const today = now.toISOString().split('T')[0];
  if (preset === '90d') { const s = new Date(now); s.setDate(s.getDate() - 90); return { start: s.toISOString().split('T')[0], end: today }; }
  if (preset === '6m')  { const s = new Date(now); s.setMonth(s.getMonth() - 6); return { start: s.toISOString().split('T')[0], end: today }; }
  if (preset === 'ytd') { return { start: `${now.getFullYear()}-01-01`, end: today }; }
  // default: 30d
  const s = new Date(now); s.setDate(s.getDate() - 30);
  return { start: s.toISOString().split('T')[0], end: today };
};

const LineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ov-tooltip">
      <p className="ov-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0', fontSize: '0.82rem' }}>
          {p.name}: ${Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct  = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
  return (
    <div className="ov-tooltip">
      <p style={{ color: item.payload.color, fontWeight: 700, margin: '0 0 2px' }}>{item.name}</p>
      <p style={{ margin: 0, fontSize: '0.82rem' }}>${Number(item.value).toLocaleString()} ({pct}%)</p>
    </div>
  );
};

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ov-tooltip">
      <p className="ov-tooltip-label">{label}</p>
      <p style={{ margin: 0, fontSize: '0.82rem', color: payload[0]?.fill }}>
        {payload[0]?.name}: {Number(payload[0]?.value).toLocaleString()}
      </p>
    </div>
  );
};

const TODAY = new Date().toISOString().split('T')[0];

const PRESETS = [
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: '6m',  label: 'Last 6 Months' },
  { id: 'ytd', label: 'This Year' },
  { id: 'custom', label: 'Custom' },
];

const trendLabel = { '30d': 'Past 30 days', '90d': 'Past 90 days', '6m': 'Past 6 months', 'ytd': 'This year', 'custom': 'Custom range' };

const OverviewTab = () => {
  const [preset,      setPreset]      = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    let start, end;
    if (preset === 'custom') {
      if (!customStart || !customEnd) return;
      start = customStart;
      end   = customEnd;
    } else {
      ({ start, end } = getPresetRange(preset));
    }

    setLoading(true);
    apiGet(`/api/analytics/overview?startDate=${start}&endDate=${end}`)
      .then(setData)
      .catch(err => toast.error(err.message || 'Failed to load overview data.'))
      .finally(() => setLoading(false));
  }, [preset, customStart, customEnd]);

  const pieData = data ? [
    { name: 'Tickets',     value: data.kpis.ticketRevenue,     color: COLORS.tickets },
    { name: 'Memberships', value: data.kpis.membershipRevenue, color: COLORS.memberships },
    { name: 'Gift Shop',   value: data.kpis.giftShopRevenue,   color: COLORS.giftShop },
    { name: 'Events',      value: data.kpis.eventRevenue ?? 0, color: COLORS.events },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="ov-root">

      {/* ── Date range bar ─────────────────────────────────────── */}
      <div className="ov-date-bar">
        <div className="ov-preset-btns">
          {PRESETS.map(p => (
            <button
              key={p.id}
              className={`ov-preset-btn${preset === p.id ? ' active' : ''}`}
              onClick={() => setPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="ov-custom-range">
            <AdminDatePicker value={customStart} onChange={setCustomStart} placeholder="Start date" maxDate={customEnd || TODAY} />
            <span className="ov-range-sep">to</span>
            <AdminDatePicker value={customEnd} onChange={setCustomEnd} placeholder="End date" minDate={customStart || undefined} maxDate={TODAY} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="ov-loading">Loading overview data...</div>
      ) : !data ? null : (
        <>
          {/* ── KPI cards ────────────────────────────────────────── */}
          <div className="ov-kpi-grid">
            <div className="ov-kpi-card">
              <p className="ov-kpi-label">Total Revenue</p>
              <p className="ov-kpi-value">{fmtKpi(data.kpis.totalRevenue)}</p>
              <p className="ov-kpi-sub">all sections</p>
            </div>
            <div className="ov-kpi-card">
              <p className="ov-kpi-label">Ticket Sales</p>
              <p className="ov-kpi-value" style={{ color: COLORS.tickets }}>{fmtKpi(data.kpis.ticketRevenue)}</p>
              <p className="ov-kpi-sub">{data.kpis.ticketCount.toLocaleString()} tickets</p>
            </div>
            <div className="ov-kpi-card">
              <p className="ov-kpi-label">Memberships Sold</p>
              <p className="ov-kpi-value" style={{ color: COLORS.memberships }}>{fmtKpi(data.kpis.membershipRevenue)}</p>
              <p className="ov-kpi-sub">{data.kpis.memberCount.toLocaleString()} members</p>
            </div>
            <div className="ov-kpi-card">
              <p className="ov-kpi-label">Gift Shop Orders</p>
              <p className="ov-kpi-value" style={{ color: COLORS.giftShop }}>{fmtKpi(data.kpis.giftShopRevenue)}</p>
              <p className="ov-kpi-sub">{data.kpis.orderCount.toLocaleString()} orders</p>
            </div>
            <div className="ov-kpi-card">
              <p className="ov-kpi-label">Event Bookings</p>
              <p className="ov-kpi-value" style={{ color: COLORS.events }}>{fmtKpi(data.kpis.eventRevenue ?? 0)}</p>
              <p className="ov-kpi-sub">{(data.kpis.eventCount ?? 0).toLocaleString()} bookings</p>
            </div>
            <div className="ov-kpi-card">
              <p className="ov-kpi-label">Total Transactions</p>
              <p className="ov-kpi-value">{data.kpis.totalTransactions.toLocaleString()}</p>
              <p className="ov-kpi-sub">across all sections</p>
            </div>
          </div>

          {/* ── Row 1: Donut + Line ───────────────────────────────── */}
          <div className="ov-charts-row">
            <div className="ov-chart-card">
              <p className="ov-chart-title">Revenue by section</p>
              <p className="ov-chart-sub">Share of total revenue</p>
              {pieData.length === 0 ? (
                <div className="ov-no-data">No revenue data for this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<PieTooltip total={data.kpis.totalRevenue} />} />
                    <Legend
                      formatter={(value, entry) => (
                        <span style={{ color: 'var(--adm-text-secondary)', fontSize: '0.78rem' }}>
                          {value} {data.kpis.totalRevenue > 0 ? Math.round((entry.payload.value / data.kpis.totalRevenue) * 100) : 0}%
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="ov-chart-card">
              <p className="ov-chart-title">Revenue trend</p>
              <p className="ov-chart-sub">
                {trendLabel[preset] || 'Custom range'} &mdash; {data.granularity === 'daily' ? 'daily' : 'monthly'} breakdown
              </p>
              {data.monthlyTrend.length === 0 ? (
                <div className="ov-no-data">No trend data for this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.monthlyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="gradTickets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={COLORS.tickets}     stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.tickets}     stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradMemberships" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={COLORS.memberships} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.memberships} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradGiftShop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={COLORS.giftShop}    stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLORS.giftShop}    stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradEvents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={COLORS.events}      stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLORS.events}      stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--adm-border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--adm-text-secondary)' }} />
                    <YAxis tickFormatter={v => v >= 1000 ? fmtMoney(v) : `$${v}`} tick={{ fontSize: 11, fill: 'var(--adm-text-secondary)' }} width={52} />
                    <Tooltip content={<LineTooltip />} />
                    <Area type="monotone" dataKey="tickets"     name="Tickets"     stroke={COLORS.tickets}     strokeWidth={2} fill="url(#gradTickets)"     dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="memberships" name="Memberships" stroke={COLORS.memberships} strokeWidth={2} fill="url(#gradMemberships)" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="giftShop"    name="Gift Shop"   stroke={COLORS.giftShop}    strokeWidth={2} fill="url(#gradGiftShop)"    dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="events"      name="Events"      stroke={COLORS.events}      strokeWidth={2} fill="url(#gradEvents)"      dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Row 2: Ticket tiers + Membership tiers ───────────── */}
          <div className="ov-charts-row">
            <div className="ov-chart-card">
              <p className="ov-chart-title">Ticket tier breakdown</p>
              <p className="ov-chart-sub">Transactions per tier</p>
              {data.ticketTiers.length === 0 ? (
                <div className="ov-no-data">No ticket sales in this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.ticketTiers} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--adm-border)" vertical={false} />
                    <XAxis dataKey="tier" tick={{ fontSize: 11, fill: 'var(--adm-text-secondary)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--adm-text-secondary)' }} />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="count" name="Orders" fill={COLORS.tickets} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="ov-chart-card">
              <p className="ov-chart-title">Membership tier breakdown</p>
              <p className="ov-chart-sub">Transactions per tier</p>
              {data.membershipTiers.length === 0 ? (
                <div className="ov-no-data">No memberships in this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.membershipTiers} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--adm-border)" vertical={false} />
                    <XAxis dataKey="tier" tick={{ fontSize: 11, fill: 'var(--adm-text-secondary)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--adm-text-secondary)' }} />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="count" name="Subscriptions" fill={COLORS.memberships} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Row 3: Gift shop categories + Event tiers ────────── */}
          <div className="ov-charts-row">
            <div className="ov-chart-card">
              <p className="ov-chart-title">Gift shop orders by category</p>
              <p className="ov-chart-sub">Order volume this period</p>
              {data.giftShopCategories.length === 0 ? (
                <div className="ov-no-data">No gift shop orders in this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.giftShopCategories} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--adm-border)" vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--adm-text-secondary)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--adm-text-secondary)' }} />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="count" name="Orders" fill={COLORS.giftShop} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="ov-chart-card">
              <p className="ov-chart-title">Event bookings by category</p>
              <p className="ov-chart-sub">Bookings per event category</p>
              {!data.eventTiers || data.eventTiers.length === 0 ? (
                <div className="ov-no-data">No event bookings in this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.eventTiers} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--adm-border)" vertical={false} />
                    <XAxis dataKey="tier" tick={{ fontSize: 11, fill: 'var(--adm-text-secondary)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--adm-text-secondary)' }} />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="count" name="Bookings" fill={COLORS.events} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OverviewTab;
