import React, { useState, useEffect, useMemo } from 'react';
import { HeartPulse, UtensilsCrossed, AlertTriangle, CheckCircle, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { getHealthReport } from '../../../services/animalHealthService';
import { toast } from 'sonner';

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
};

const scoreClass = (s) => {
  if (s >= 90) return 'ah-score-excellent';
  if (s >= 65) return 'ah-score-good';
  if (s >= 40) return 'ah-score-fair';
  return 'ah-score-critical';
};

const scoreLabel = (s) => {
  if (s >= 90) return 'Excellent';
  if (s >= 65) return 'Good';
  if (s >= 40) return 'Fair';
  return 'Critical';
};

const th = { padding: '8px 12px', textAlign: 'left', color: 'var(--adm-text-secondary)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' };
const td = { padding: '8px 12px', color: 'var(--adm-text-primary)', fontSize: '0.8rem' };

const AnimalReportTables = ({ activeTab, dateFrom, dateTo }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState('all');

  useEffect(() => {
    getHealthReport()
      .then(setData)
      .catch(err => toast.error(err.message || 'Failed to load report data.'))
      .finally(() => setLoading(false));
  }, []);

  const inDateRange = (dateStr) => {
    if (!dateFrom && !dateTo) return true;
    if (!dateStr) return false;
    const d = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  const filteredRecords = useMemo(() => {
    if (!data?.records) return [];
    return data.records.filter(r => inDateRange(r.CheckupDate)).sort((a, b) => new Date(b.CheckupDate || 0) - new Date(a.CheckupDate || 0));
  }, [data, dateFrom, dateTo]);

  const filteredAlerts = useMemo(() => {
    if (!data?.alerts) return [];
    let a = data.alerts.filter(al => inDateRange(al.CreatedAt));
    if (alertFilter === 'active') a = a.filter(al => !al.IsResolved);
    if (alertFilter === 'resolved') a = a.filter(al => al.IsResolved);
    return a.sort((x, y) => new Date(y.CreatedAt || 0) - new Date(x.CreatedAt || 0));
  }, [data, dateFrom, dateTo, alertFilter]);

  const feedings = useMemo(() => data?.feedings || [], [data]);

  if (loading) return <div className="admin-table-empty" style={{ padding: 40 }}>Loading data...</div>;
  if (!data) return <div className="admin-table-empty" style={{ padding: 40 }}>No data available.</div>;

  if (activeTab === 'records') {
    return (
      <div className="admin-table-container">
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--adm-border)' }}>
          <HeartPulse size={16} color="#ef4444" />
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>All Health Records</span>
          <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.78rem', marginLeft: 4 }}>({filteredRecords.length} records)</span>
        </div>
        <div className="admin-table-scroll-inner" style={{ maxHeight: 600 }}>
          {filteredRecords.length === 0 ? (
            <div className="admin-table-empty">No health records {dateFrom || dateTo ? 'in the selected date range.' : 'found.'}</div>
          ) : (
            <table className="admin-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>Animal</th><th>Species</th><th>Date</th><th>Score</th>
                  <th>Weight</th><th>Activity</th><th>Staff</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => (
                  <tr key={r.RecordID}>
                    <td style={{ fontWeight: 600 }}>{r.AnimalName}</td>
                    <td style={{ color: 'var(--adm-text-secondary)' }}>{r.Species}</td>
                    <td>{fmtDate(r.CheckupDate)}</td>
                    <td><span className={`ah-score ${scoreClass(r.HealthScore)}`}><span className="ah-score-dot" />{r.HealthScore} — {scoreLabel(r.HealthScore)}</span></td>
                    <td>{r.Weight != null ? `${Number(r.Weight).toFixed(1)} kg` : '—'}</td>
                    <td style={{ color: 'var(--adm-text-secondary)' }}>{r.ActivityLevel || '—'}</td>
                    <td style={{ color: 'var(--adm-text-secondary)' }}>{r.StaffName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'feedings') {
    return (
      <div className="admin-table-container">
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--adm-border)' }}>
          <UtensilsCrossed size={16} color="#f59e0b" />
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>All Feeding Schedules</span>
          <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.78rem', marginLeft: 4 }}>({feedings.length} schedules)</span>
        </div>
        <div className="admin-table-scroll-inner" style={{ maxHeight: 600 }}>
          {feedings.length === 0 ? (
            <div className="admin-table-empty">No feeding schedules found.</div>
          ) : (
            <table className="admin-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>Animal</th><th>Species</th><th>Feed Time</th><th>Food Type</th><th>Staff</th>
                </tr>
              </thead>
              <tbody>
                {feedings.map(f => (
                  <tr key={f.ScheduleID}>
                    <td style={{ fontWeight: 600 }}>{f.AnimalName}</td>
                    <td style={{ color: 'var(--adm-text-secondary)' }}>{f.Species}</td>
                    <td>{f.FeedTime ? new Date(f.FeedTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td>{f.FoodType || '—'}</td>
                    <td style={{ color: 'var(--adm-text-secondary)' }}>{f.StaffName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'alerts') {
    return (
      <div className="admin-table-container">
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--adm-border)', flexWrap: 'wrap' }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>All Health Alerts</span>
          <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.78rem', marginLeft: 4 }}>({filteredAlerts.length} alerts)</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {['all', 'active', 'resolved'].map(f => (
              <button key={f} onClick={() => setAlertFilter(f)}
                style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${alertFilter === f ? 'var(--adm-accent)' : 'var(--adm-border)'}`, background: alertFilter === f ? 'var(--adm-accent-dim)' : 'transparent', color: alertFilter === f ? 'var(--adm-accent)' : 'var(--adm-text-secondary)', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-table-scroll-inner" style={{ maxHeight: 600 }}>
          {filteredAlerts.length === 0 ? (
            <div className="admin-table-empty">No health alerts {dateFrom || dateTo ? 'in the selected date range' : ''} {alertFilter !== 'all' ? `(${alertFilter})` : ''}.</div>
          ) : (
            <table className="admin-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>Animal</th><th>Species</th><th>Date</th><th>Type</th><th>Message</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map(al => (
                  <tr key={al.AlertID}>
                    <td style={{ fontWeight: 600 }}>{al.AnimalName}</td>
                    <td style={{ color: 'var(--adm-text-secondary)' }}>{al.Species}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(al.CreatedAt)}</td>
                    <td>{al.AlertType}</td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--adm-text-secondary)' }}>{al.AlertMessage}</td>
                    <td>{al.IsResolved
                      ? <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}><CheckCircle size={13} style={{ verticalAlign: 'middle' }} /> Resolved</span>
                      : <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8rem' }}><AlertTriangle size={13} style={{ verticalAlign: 'middle' }} /> Active</span>
                    }</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default AnimalReportTables;
