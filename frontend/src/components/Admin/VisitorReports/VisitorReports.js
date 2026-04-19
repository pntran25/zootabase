import { useState, useEffect } from 'react';
import { apiGet } from '../../../services/apiClient';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import './VisitorReports.css';

const VisitorReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('today');

  const loadData = (start, end) => {
    setLoading(true);
    apiGet(`/api/analytics/visitors?startDate=${start}&endDate=${end}`)
      .then(res => setData(res))
      .catch(err => toast.error(err.message || 'Failed to load visitor analytics.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    loadData(today, today);
  }, []);

  const applyRange = (preset) => {
    setRange(preset);

    const today = new Date();
    let start, end;

    if (preset === 'today') {
      start = end = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    }

    if (preset === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      start = new Date(weekAgo.getTime() - weekAgo.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      end = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    }

    if (preset === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setDate(today.getDate() - 30);
      start = new Date(monthAgo.getTime() - monthAgo.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      end = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    }

    loadData(start, end);
  };

  const exportCSV = () => {
    if (!data) return;

    let csv = "Date,Ticket Visitors,Event Attendees,Total\n";

    data.daily.ticketVisitors.forEach(row => {
      const eventRow = data.daily.eventVisitors.find(e => e.visitDate === row.visitDate);
      const total = (row.visitors || 0) + (eventRow?.attendees || 0);

      csv += `${row.visitDate},${row.visitors},${eventRow?.attendees || 0},${total}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "visitor-report.csv";
    a.click();
  };

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Visitor Activity Report</h1>
        <p>Loading visitor activity...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Visitor Activity Report</h1>
        <p>No visitor data available.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">

      {/* Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Visitor Activity Report</h1>
        <p className="admin-page-subtitle">
          Combined visitor analytics from ticket sales and event attendance
        </p>
      </div>

      {/* Date Filters */}
      <div className="dr-tabs vr-toolbar">
        <div className={`dr-tab ${range === 'today' ? 'active' : ''}`} onClick={() => applyRange('today')}>
          Today
        </div>
        <div className={`dr-tab ${range === 'week' ? 'active' : ''}`} onClick={() => applyRange('week')}>
          Last 7 Days
        </div>
        <div className={`dr-tab ${range === 'month' ? 'active' : ''}`} onClick={() => applyRange('month')}>
          Last 30 Days
        </div>

        <button className="dr-details-btn vr-export-btn" onClick={exportCSV}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="vr-kpi-grid">
        <div className="vr-kpi-card">
          <p className="vr-kpi-label">Ticket Visitors</p>
          <p className="vr-kpi-value">{data.totals.ticketVisitors}</p>
        </div>

        <div className="vr-kpi-card">
          <p className="vr-kpi-label">Event Attendees</p>
          <p className="vr-kpi-value">{data.totals.eventVisitors}</p>
        </div>

        <div className="vr-kpi-card vr-kpi-accent">
          <p className="vr-kpi-label">Total Visitors</p>
          <p className="vr-kpi-value">{data.totals.combinedVisitors}</p>
        </div>
      </div>

      {/* Daily Visitors Table */}
      <div className="dr-detail-section">
        <p className="dr-detail-section-title">Daily Visitor Trend</p>

        <div className="dr-items-table vr-table">
          <div className="dr-items-header vr-table-header-4">
            <span>Date</span>
            <span>Ticket Visitors</span>
            <span>Event Attendees</span>
            <span>Total</span>
          </div>

          {data.daily.ticketVisitors.map((row, i) => {
            const eventRow = data.daily.eventVisitors.find(e => e.visitDate === row.visitDate);
            const total = (row.visitors || 0) + (eventRow?.attendees || 0);

            return (
              <div key={i} className="dr-items-row vr-table-row-4">
                <span>{new Date(row.visitDate).toLocaleDateString()}</span>
                <span>{row.visitors}</span>
                <span>{eventRow?.attendees || 0}</span>
                <span className="dr-total-badge">{total}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ticket Type Breakdown */}
      <div className="dr-detail-section" style={{ marginTop: 30 }}>
        <p className="dr-detail-section-title">Ticket Type Breakdown</p>

        <div className="dr-items-table vr-table">
          <div className="dr-items-header vr-table-header-3">
            <span>Ticket Type</span>
            <span>Orders</span>
            <span>Visitors</span>
          </div>

          {data.ticketTypeBreakdown.map((t, i) => (
            <div key={i} className="dr-items-row vr-table-row-3">
              <span>{t.TicketType}</span>
              <span>{t.orders}</span>
              <span>{t.visitors}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default VisitorReports;
