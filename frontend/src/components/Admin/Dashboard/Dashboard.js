import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  PawPrint, Ticket, Wrench, TrendingUp, TrendingDown,
  CalendarDays, ArrowUpRight, ArrowDownRight,
  Zap, ShoppingBag, CreditCard
} from 'lucide-react';
import './Dashboard.css';
import { getLowStockProducts } from '../../../services/productService';
import { apiGet, API_BASE_URL } from '../../../services/apiClient';

/* ── Count-up Animation Hook ─────────────────────────── */
const useCountAnimation = (target, duration = 900) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start;
    let rafId;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(step);
      else setValue(target);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return value;
};

/* ── Relative Time ───────────────────────────────────── */
const timeAgo = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const pctDelta = (curr, prev) => {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return null;
  return ((curr - prev) / prev * 100).toFixed(1);
};

const activityIcons = {
  animal: <PawPrint size={14} />,
  maintenance: <Wrench size={14} />,
  event: <CalendarDays size={14} />,
};

/* ── Framer Motion Variants ─────────────────────────── */
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, type: 'spring', stiffness: 280, damping: 22 }
  })
};

const panelVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.35 + i * 0.08, type: 'spring', stiffness: 260, damping: 24 }
  })
};

/* ── Custom Tooltip ──────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: '2px 0', fontSize: '0.82rem', fontWeight: 600 }}>
            {p.name === 'visitors' ? 'This week' : 'Last week'}: {Number(p.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ── Dashboard Component ────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [dashStats, setDashStats] = useState({
    totalAnimals: 0,
    animalsThisMonth: 0,
    animalsLastMonth: 0,
    openMaintenance: 0,
    recentActivity: [],
    ticketsThisMonth: 0,
    ticketsLastMonth: 0,
    membersThisMonth: 0,
    membersLastMonth: 0,
    weeklyVisitors: [],
  });

  useEffect(() => {
    getLowStockProducts().then(setLowStockProducts).catch(() => {});
    apiGet('/api/dashboard').then(setDashStats).catch(() => {});
  }, []);

  const animalsAnim     = useCountAnimation(dashStats.totalAnimals);
  const maintenanceAnim = useCountAnimation(dashStats.openMaintenance);
  const ticketsAnim     = useCountAnimation(dashStats.ticketsThisMonth);
  const membersAnim     = useCountAnimation(dashStats.membersThisMonth);

  // Animal trend (this month vs last month)
  const { animalsThisMonth, animalsLastMonth } = dashStats;
  const animalBadge    = animalsThisMonth > 0 ? `+${animalsThisMonth} This Month` : 'No new this month';
  const animalTrendPct = animalsLastMonth > 0
    ? `${animalsThisMonth >= animalsLastMonth ? '+' : ''}${Math.round((animalsThisMonth - animalsLastMonth) / animalsLastMonth * 100)}%`
    : animalsThisMonth > 0 ? `+${animalsThisMonth} New` : '—';
  const animalTrendUp  = animalsThisMonth >= animalsLastMonth;

  // Tickets this month vs last month
  const ticketDelta   = pctDelta(dashStats.ticketsThisMonth, dashStats.ticketsLastMonth);
  const ticketTrendUp = dashStats.ticketsThisMonth >= dashStats.ticketsLastMonth;
  const ticketBadge   = ticketDelta !== null
    ? `${ticketDelta > 0 ? '+' : ''}${ticketDelta}% vs Last Month`
    : 'vs Last Month';

  // Memberships this month vs last month
  const memberDelta   = pctDelta(dashStats.membersThisMonth, dashStats.membersLastMonth);
  const memberTrendUp = dashStats.membersThisMonth >= dashStats.membersLastMonth;
  const memberBadge   = memberDelta !== null
    ? `${memberDelta > 0 ? '+' : ''}${memberDelta}% vs Last Month`
    : 'vs Last Month';

  // Weekly visitor trend
  const weeklyVisitorsArr = Array.isArray(dashStats.weeklyVisitors) ? dashStats.weeklyVisitors : [];
  const weeklyTotal     = weeklyVisitorsArr.reduce((s, d) => s + d.visitors, 0);
  const prevWeeklyTotal = weeklyVisitorsArr.reduce((s, d) => s + d.prev, 0);
  const weeklyDelta     = pctDelta(weeklyTotal, prevWeeklyTotal);
  const weeklyTrendUp   = weeklyTotal >= prevWeeklyTotal;

  const stats = [
    {
      label: 'Total Animals',
      display: animalsAnim,
      badge: animalBadge,
      badgeType: animalsThisMonth > 0 ? 'positive' : 'neutral',
      color: 'green',
      icon: <PawPrint size={22} />,
      trend: animalTrendPct,
      trendUp: animalTrendUp,
    },
    {
      label: 'Tickets Sold This Month',
      display: ticketsAnim,
      badge: ticketBadge,
      badgeType: ticketTrendUp ? 'positive' : 'warning',
      color: 'blue',
      icon: <Ticket size={22} />,
      trend: ticketDelta !== null ? `${ticketDelta > 0 ? '+' : ''}${ticketDelta}%` : '—',
      trendUp: ticketTrendUp,
    },
    {
      label: 'Memberships This Month',
      display: membersAnim,
      badge: memberBadge,
      badgeType: memberTrendUp ? 'positive' : 'warning',
      color: 'purple',
      icon: <CreditCard size={22} />,
      trend: memberDelta !== null ? `${memberDelta > 0 ? '+' : ''}${memberDelta}%` : '—',
      trendUp: memberTrendUp,
    },
    {
      label: 'Open Maintenance',
      display: maintenanceAnim,
      badge: dashStats.openMaintenance > 0 ? 'Requires Attention' : 'All Clear',
      badgeType: dashStats.openMaintenance > 0 ? 'warning' : 'positive',
      color: 'orange',
      icon: <Wrench size={22} />,
      trend: dashStats.openMaintenance > 0 ? `${dashStats.openMaintenance} open` : '0 open',
      trendUp: dashStats.openMaintenance === 0,
    },
  ];

  const quickActions = [
    { label: 'Add Animal', icon: <PawPrint size={20} />, path: '/admin/animals', color: 'green' },
    { label: 'New Event', icon: <CalendarDays size={20} />, path: '/admin/events', color: 'blue' },
    { label: 'Log Issue', icon: <Wrench size={20} />, path: '/admin/maintenance', color: 'orange' },
  ];

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard Overview</h1>
          <p className="admin-page-subtitle">Welcome back — here's what's happening at Zootabase Zoo today.</p>
        </div>
        <div className="dashboard-date">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="admin-stats-grid">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={`stat-card stat-card--${stat.color}`}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
          >
            <div className="stat-card-header">
              <div className={`stat-icon-wrapper ${stat.color}`}>
                {stat.icon}
              </div>
              <span className={`stat-badge ${stat.badgeType}`}>{stat.badge}</span>
            </div>
            <p className="stat-label">{stat.label}</p>
            <div className="stat-bottom">
              <h2 className="stat-value">{stat.display}</h2>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        className="quick-actions-row"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, type: 'spring', stiffness: 260, damping: 22 }}
      >
        <div className="quick-actions-label">
          <Zap size={14} />
          Quick Actions
        </div>
        <div className="quick-actions-grid">
          {quickActions.map(({ label, icon, path, color }) => (
            <motion.button
              key={label}
              className={`quick-action-btn quick-action-btn--${color}`}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(path)}
            >
              <span className={`quick-action-icon quick-action-icon--${color}`}>{icon}</span>
              <span>{label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <motion.div
          className="dashboard-panel"
          style={{ borderLeft: '4px solid #ea580c', marginBottom: 20 }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="panel-header-flex" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShoppingBag size={18} style={{ color: '#ea580c' }} />
              <div>
                <h3 className="panel-title" style={{ color: '#ea580c', marginBottom: 2 }}>Low Stock Alert</h3>
                <p className="panel-subtitle">{lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} need restocking</p>
              </div>
            </div>
            <button className="panel-view-all" onClick={() => navigate('/admin/shop')}>Go to Shop →</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {lowStockProducts.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(234,88,12,0.1)',
                border: '1px solid rgba(234,88,12,0.3)',
                borderRadius: 8, padding: '8px 14px',
              }}>
                {p.imageUrl ? (
                  <img src={`${API_BASE_URL}${p.imageUrl}`} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <ShoppingBag size={16} style={{ color: '#ea580c', flexShrink: 0 }} />
                )}
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--adm-text-primary)', display: 'block' }}>{p.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#fb923c' }}>
                    {p.stockQuantity === 0 ? 'Out of stock' : 'Stock is Low'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Content Grid */}
      <div className="dashboard-content-grid">
        {/* Visitor Chart */}
        <motion.div
          className="dashboard-panel chart-panel"
          custom={0}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="panel-header-flex">
            <div>
              <h3 className="panel-title">Visitor Attendance</h3>
              <p className="panel-subtitle">Weekly comparison — current vs previous week</p>
            </div>
            <span className={`trend-badge${!weeklyTrendUp ? ' trend-badge--down' : ''}`}>
              {weeklyTrendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {weeklyDelta !== null ? `${weeklyDelta > 0 ? '+' : ''}${weeklyDelta}% this week` : 'This week'}
            </span>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={dashStats.weeklyVisitors} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gradVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--adm-border-light)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--adm-text-muted)', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--adm-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="prev" stroke="#94a3b8" strokeWidth={1.5} fill="url(#gradPrev)" strokeDasharray="4 3" name="prev" />
              <Area type="monotone" dataKey="visitors" stroke="#10b981" strokeWidth={2.5} fill="url(#gradVisitors)" name="visitors" />
            </AreaChart>
          </ResponsiveContainer>

          <div className="chart-legend">
            <span className="chart-legend-item"><span className="legend-dot legend-dot--green" />This week</span>
            <span className="chart-legend-item"><span className="legend-dot legend-dot--gray" />Last week</span>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <div className="dashboard-right-col">
          <motion.div
            className="dashboard-panel activity-panel"
            custom={2}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
          >
            <h3 className="panel-title" style={{ marginBottom: 16 }}>Recent Activity</h3>
            <div className="activity-list">
              {dashStats.recentActivity.length === 0 ? (
                <p style={{ color: 'var(--adm-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '16px 0' }}>
                  No recent activity
                </p>
              ) : dashStats.recentActivity.map((item, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-icon activity-icon--${item.type}`}>
                    {activityIcons[item.type] || activityIcons.animal}
                  </div>
                  <div className="activity-content">
                    <span className="activity-action">{item.action}</span>
                    <span className="activity-detail">{item.detail}</span>
                  </div>
                  <span className="activity-time">{timeAgo(item.ts)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
