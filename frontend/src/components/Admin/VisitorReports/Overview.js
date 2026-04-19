import { useState, useEffect } from 'react';
import { apiGet } from '../../../services/apiClient';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import './VisitorReports.css';
import './Overview.css';

const VisitorReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('month');

  const loadData = (start, end) => {
    setLoading(true);
    apiGet(`/api/analytics/visitors?startDate=${start}&endDate=${end}`)
      .then(res => setData(res))
      .catch(err => {
        console.error('Visitor data error:', err);
        toast.error(err.message || 'Failed to load visitor analytics.');
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
      <div className="vr-page">
        <h1>Visitor Activity & Attendance Report</h1>
        <p>Loading visitor activity...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="vr-page">
        <h1>Visitor Activity & Attendance Report</h1>
        <p>No visitor data available.</p>
      </div>
    );
  }

  return (
    <div className="vr-page">

      {/* Header */}
      <div className="vr-header">
        <h1>Visitor Activity & Attendance Report</h1>
        <p>Attendance trends, ticket breakdowns, visitor behavior & event fill rates</p>
      </div>

      {/* Date Filters */}
      <div className="vr-date-filters">
        <button className={range === 'month' ? 'active' : ''} onClick={() => applyRange('month')}>
          Last 30 Days
        </button>
        <button className={range === 'week' ? 'active' : ''} onClick={() => applyRange('week')}>
          Last 7 Days
        </button>
        <button className={range === 'today' ? 'active' : ''} onClick={() => applyRange('today')}>
          Today
        </button>

        <button className="vr-export-btn" onClick={exportCSV}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="vr-kpi-grid">
        <div className="vr-kpi-card">
          <h2>{data.totals.combinedVisitors}</h2>
          <p>Total Visitors</p>
        </div>

        <div className="vr-kpi-card">
          <h2>{data.totals.ticketVisitors}</h2>
          <p>Ticket Orders</p>
        </div>

        <div className="vr-kpi-card">
          <h2>{data.totals.eventVisitors}</h2>
          <p>Event Bookings</p>
        </div>
      </div>

      {/* Daily Visitors Table */}
      <div className="vr-section">
        <h3>Daily Visitor Attendance</h3>

        <div className="vr-table">
          <div className="vr-table-header">
            <span>Date</span>
            <span>Ticket Visitors</span>
            <span>Event Attendees</span>
            <span>Total</span>
          </div>

          {data.daily.ticketVisitors.map((row, i) => {
            const eventRow = data.daily.eventVisitors.find(e => e.visitDate === row.visitDate);
            const total = (row.visitors || 0) + (eventRow?.attendees || 0);

            return (
              <div key={i} className="vr-table-row">
                <span>{new Date(row.visitDate).toLocaleDateString()}</span>
                <span>{row.visitors}</span>
                <span>{eventRow?.attendees || 0}</span>
                <span className="vr-total">{total}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default VisitorReports;
