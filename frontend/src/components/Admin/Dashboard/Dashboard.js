import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  PawPrint, Ticket, Wrench, Star, TrendingUp,
  CalendarDays, ArrowUpRight, ArrowDownRight,
  Zap, ShoppingBag
} from 'lucide-react';
import './Dashboard.css';
import { getLowStockProducts } from '../../../services/productService';
import { API_BASE_URL } from '../../../services/apiClient';

/* ── Count-up Animation Hook ─────────────────────────── */
const useCountAnimation = (target, duration = 900) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start;
    let rafId;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setValue(Math.floor(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(step);
      else setValue(target);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return value;
};

/* ── Mock Data ──────────────────────────────────────── */
const visitorData = [
  { day: 'Mon', visitors: 240, prev: 210 },
  { day: 'Tue', visitors: 300, prev: 270 },
  { day: 'Wed', visitors: 220, prev: 260 },
  { day: 'Thu', visitors: 272, prev: 240 },
  { day: 'Fri', visitors: 360, prev: 310 },
  { day: 'Sat', visitors: 420, prev: 380 },
  { day: 'Sun', visitors: 385, prev: 350 },
];

const recentActivity = [
  { action: 'New animal added', detail: 'Bengal Tiger — Savanna Exhibit', time: '2h ago', type: 'animal' },
  { action: 'Maintenance resolved', detail: 'Water filtration — Penguin Coast', time: '4h ago', type: 'maintenance' },
  { action: 'Event created', detail: 'Evening Safari Experience — Fri Mar 21', time: '1d ago', type: 'event' },
];

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
            {p.name === 'visitors' ? 'This week' : 'Last week'}: {p.value.toLocaleString()}
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

  useEffect(() => {
    getLowStockProducts().then(setLowStockProducts).catch(() => {});
  }, []);

  const animals = useCountAnimation(12);
  const tickets = useCountAnimation(482);
  const maintenance = useCountAnimation(2);
  const satisfaction = useCountAnimation(40); // x10 = 4.0

  const stats = [
    {
      label: 'Total Animals',
      value: animals,
      display: animals,
      badge: '+2 This Month',
      badgeType: 'positive',
      color: 'green',
      icon: <PawPrint size={22} />,
      trend: '+18%',
      trendUp: true,
    },
    {
      label: 'Tickets Sold Today',
      value: tickets,
      display: tickets,
      badge: '+12% vs Last Week',
      badgeType: 'positive',
      color: 'blue',
      icon: <Ticket size={22} />,
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Open Maintenance',
      value: maintenance,
      display: maintenance,
      badge: 'Requires Attention',
      badgeType: 'warning',
      color: 'orange',
      icon: <Wrench size={22} />,
      trend: '-1',
      trendUp: false,
    },
    {
      label: 'Avg. Satisfaction',
      value: satisfaction,
      display: (satisfaction / 10).toFixed(1),
      badge: '/ 5.0',
      badgeType: 'neutral',
      color: 'purple',
      icon: <Star size={22} />,
      trend: '+0.2',
      trendUp: true,
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
          <p className="admin-page-subtitle">Welcome back — here's what's happening at WildWoods today.</p>
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
              <span className={`stat-trend ${stat.trendUp ? 'up' : 'down'}`}>
                {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.trend}
              </span>
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
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 8, padding: '8px 14px' }}>
                {p.imageUrl ? (
                  <img src={`${API_BASE_URL}${p.imageUrl}`} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <ShoppingBag size={16} style={{ color: '#ea580c', flexShrink: 0 }} />
                )}
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9a3412', display: 'block' }}>{p.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#c2410c' }}>
                    {p.stockQuantity === 0 ? 'Out of stock' : `${p.stockQuantity} left`} · reorder at {p.lowStockThreshold}
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
            <span className="trend-badge">
              <TrendingUp size={13} /> +8.4% this week
            </span>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={visitorData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
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
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--adm-text-muted)', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--adm-text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="prev"
                stroke="#94a3b8"
                strokeWidth={1.5}
                fill="url(#gradPrev)"
                strokeDasharray="4 3"
                name="prev"
              />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#gradVisitors)"
                name="visitors"
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="chart-legend">
            <span className="chart-legend-item"><span className="legend-dot legend-dot--green" />This week</span>
            <span className="chart-legend-item"><span className="legend-dot legend-dot--gray" />Last week</span>
          </div>
        </motion.div>

        {/* Right column */}
        <div className="dashboard-right-col">
          {/* Recent Activity */}
          <motion.div
            className="dashboard-panel activity-panel"
            custom={2}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
          >
            <h3 className="panel-title" style={{ marginBottom: 16 }}>Recent Activity</h3>
            <div className="activity-list">
              {recentActivity.map((item, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-icon activity-icon--${item.type}`}>
                    {activityIcons[item.type]}
                  </div>
                  <div className="activity-content">
                    <span className="activity-action">{item.action}</span>
                    <span className="activity-detail">{item.detail}</span>
                  </div>
                  <span className="activity-time">{item.time}</span>
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
