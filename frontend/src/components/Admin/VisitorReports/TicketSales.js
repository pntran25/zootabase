import { useState, useEffect } from 'react';
import { apiGet } from '../../../services/apiClient';
import { toast } from 'sonner';
import './VisitorReports.css';
import './TicketSales.css';

const TicketSales = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('month');

  const loadData = (start, end) => {
    setLoading(true);
    apiGet(`/api/analytics/ticket-sales?startDate=${start}&endDate=${end}`)
      .then(res => setData(res))
      .catch(err => {
        console.error('Ticket sales error:', err);
        toast.error(err.message || 'Failed to load ticket sales analytics.');
        setData(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const start = new Date(monthAgo.getTime() - monthAgo.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    loadData(start, today);
  }, []);

  const applyRange = (preset) => {
    setRange(preset);

    const today = new Date();
    let start, end;

    if (preset === 'today') {
      start = end = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    } else if (preset === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      start = new Date(weekAgo.getTime() - weekAgo.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      end = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    } else if (preset === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setDate(today.getDate() - 30);
      start = new Date(monthAgo.getTime() - monthAgo.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      end = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    }

    loadData(start, end);
  };

  if (loading) {
    return (
      <div className="ts-page">
        <h1>Ticket Sales</h1>
        <p>Loading ticket sales...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="ts-page">
        <h1>Ticket Sales</h1>
        <p>No ticket sales data available.</p>
      </div>
    );
  }

  return (
    <div className="ts-page">

      {/* Header */}
      <div className="ts-header">
        <h1>Ticket Sales</h1>
        <p>Sales volume, revenue, and ticket tier performance</p>
      </div>

      {/* Date Filters */}
      <div className="ts-date-filters">
        <button className={range === 'month' ? 'active' : ''} onClick={() => applyRange('month')}>
          Last 30 Days
        </button>
        <button className={range === 'week' ? 'active' : ''} onClick={() => applyRange('week')}>
          Last 7 Days
        </button>
        <button className={range === 'today' ? 'active' : ''} onClick={() => applyRange('today')}>
          Today
        </button>
      </div>

      {/* KPI Cards */}
      <div className="ts-kpi-grid">
        <div className="ts-kpi-card">
          <h2>{data.totalTickets.toLocaleString()}</h2>
          <p>Total Tickets Sold</p>
          <span className="ts-trend">▲ {data.trends.totalTickets}%</span>
        </div>

        <div className="ts-kpi-card">
          <h2>${data.totalRevenue.toLocaleString()}</h2>
          <p>Total Ticket Revenue</p>
          <span className="ts-trend">▲ {data.trends.totalRevenue}%</span>
        </div>

        <div className="ts-kpi-card">
          <h2>${data.avgTicketValue}</h2>
          <p>Avg Ticket Value</p>
          <span className="ts-trend">▲ {data.trends.avgTicketValue}%</span>
        </div>

        <div className="ts-kpi-card accent">
          <h2>{data.topTier.name}</h2>
          <p>Top Tier ({data.topTier.sold.toLocaleString()} sold)</p>
        </div>
      </div>

      {/* Ticket Tier Breakdown Table */}
      <div className="ts-section">
        <h3>Ticket Tier Breakdown</h3>

        <div className="ts-table">
          <div className="ts-table-header">
            <span>Ticket Type</span>
            <span>Tickets Sold</span>
            <span>Revenue</span>
            <span>% of Sales</span>
            <span>Avg Price</span>
          </div>

          {data.breakdown.map((t, i) => (
            <div key={i} className="ts-table-row">
              <span>{t.type}</span>
              <span>{t.sold.toLocaleString()}</span>
              <span>${t.revenue.toLocaleString()}</span>
              <span>{t.percent}%</span>
              <span>${t.avgPrice}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart Placeholder */}
      <div className="ts-section">
        <h3>Tickets Sold by Tier</h3>

        <div className="ts-chart-card">
          <div className="ts-chart-placeholder">
            {/* You will plug in Chart.js or Recharts here */}
            <p>Bar Chart Placeholder</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TicketSales;
