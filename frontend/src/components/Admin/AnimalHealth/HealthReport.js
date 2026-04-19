import React, { useState, useEffect, useMemo } from 'react';
import '../AdminTable.css';
import './HealthReport.css';
import {
  Activity, AlertTriangle, CheckCircle,
  Scale, Search, ChevronDown, ChevronUp, HeartPulse, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { getHealthReport } from '../../../services/animalHealthService';
import { exportSectionsToSingleSheet } from '../../../utils/exportExcel';

/* ── Helpers ──────────────────────────────────────────── */
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
};

const fmtTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const scoreClass = (s) => {
  if (s >= 90) return 'hr-score-excellent';
  if (s >= 65) return 'hr-score-good';
  if (s >= 40) return 'hr-score-fair';
  return 'hr-score-critical';
};

const scoreLabel = (s) => {
  if (s >= 90) return 'Excellent';
  if (s >= 65) return 'Good';
  if (s >= 40) return 'Fair';
  return 'Critical';
};

/* ── Tabs config ──────────────────────────────────────── */
const TABS = [
  { id: 'alerts', label: 'Health Alerts', icon: <AlertTriangle size={16} /> },
  { id: 'records', label: 'Health Records', icon: <HeartPulse size={16} /> },
  { id: 'metrics', label: 'Health Metrics', icon: <Scale size={16} /> },
];

/* ── Sort helper ──────────────────────────────────────── */
const useSortable = (data, tiebreakerKey) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortKey], bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      // Tiebreaker: sort by ID descending so newest entries appear first
      if (tiebreakerKey && a[tiebreakerKey] != null && b[tiebreakerKey] != null) {
        return b[tiebreakerKey] - a[tiebreakerKey];
      }
      return 0;
    });
  }, [data, sortKey, sortDir, tiebreakerKey]);

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronDown size={12} className="hr-sort-icon hr-sort-inactive" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="hr-sort-icon" />
      : <ChevronDown size={12} className="hr-sort-icon" />;
  };

  return { sorted, handleSort, SortIcon };
};

/* ── Main component ───────────────────────────────────── */
const HealthReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('alerts');
  const [search, setSearch] = useState('');
  const [alertFilter, setAlertFilter] = useState('all'); // all | active | resolved
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    setLoading(true);
    getHealthReport()
      .then(d => setData(d))
      .catch(err => toast.error(err.message || 'Failed to load health report.'))
      .finally(() => setLoading(false));
  }, []);

  /* ── Date filter helper ───────────────────────────────── */
  const inDateRange = (dateStr) => {
    if (!dateFrom && !dateTo) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr).toISOString().split('T')[0];
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  /* ── Filtered data per tab ──────────────────────────── */
  const q = search.toLowerCase();

  const filteredAlerts = useMemo(() => {
    if (!data) return [];
    let list = data.alerts;
    if (alertFilter === 'active') list = list.filter(a => !a.IsResolved);
    if (alertFilter === 'resolved') list = list.filter(a => a.IsResolved);
    list = list.filter(a => inDateRange(a.CreatedAt));
    if (q) list = list.filter(a =>
      (a.AnimalName || '').toLowerCase().includes(q) ||
      (a.AnimalCode || '').toLowerCase().includes(q) ||
      (a.Species || '').toLowerCase().includes(q) ||
      (a.AlertType || '').toLowerCase().includes(q) ||
      (a.AlertMessage || '').toLowerCase().includes(q)
    );
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, alertFilter, q, dateFrom, dateTo]);

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    let list = data.records;
    list = list.filter(r => inDateRange(r.CheckupDate));
    if (q) list = list.filter(r =>
      (r.AnimalName || '').toLowerCase().includes(q) ||
      (r.AnimalCode || '').toLowerCase().includes(q) ||
      (r.Species || '').toLowerCase().includes(q) ||
      (r.StaffName || '').toLowerCase().includes(q)
    );
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, q, dateFrom, dateTo]);

  const filteredMetrics = useMemo(() => {
    if (!data) return [];
    let list = data.metrics;
    list = list.filter(m => inDateRange(m.RecordDate));
    if (q) list = list.filter(m =>
      (m.AnimalName || '').toLowerCase().includes(q) ||
      (m.AnimalCode || '').toLowerCase().includes(q) ||
      (m.Species || '').toLowerCase().includes(q) ||
      (m.ActivityLevel || '').toLowerCase().includes(q) ||
      (m.MedicalConditions || '').toLowerCase().includes(q)
    );
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, q, dateFrom, dateTo]);

  const stats = data?.stats;

  /* ── Sort hooks for each tab ───────────────────────── */
  const alertSort = useSortable(filteredAlerts, 'AlertID');
  const recordSort = useSortable(filteredRecords, 'RecordID');
  const metricSort = useSortable(filteredMetrics, 'MetricID');


  return (
    <div className="admin-page">
      {/* ── Header ── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title"><Activity size={26} className="title-icon" /> Health Report</h1>
          <p className="admin-page-subtitle">Comprehensive health overview across all animals</p>
        </div>
        {data && (
          <button
            className="dr-details-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}
            onClick={() => {
              const alertRows = filteredAlerts.map(a => ({
                'Animal': a.AnimalName || '', 'Code': a.AnimalCode || '', 'Species': a.Species || '',
                'Alert Type': a.AlertType || '', 'Message': a.AlertMessage || '',
                'Date': a.CreatedAt ? new Date(a.CreatedAt).toLocaleDateString() : '',
                'Status': a.IsResolved ? 'Resolved' : 'Active',
              }));
              const recordRows = filteredRecords.map(r => ({
                'Animal': r.AnimalName || '', 'Code': r.AnimalCode || '', 'Species': r.Species || '',
                'Checkup Date': r.CheckupDate ? new Date(r.CheckupDate).toLocaleDateString() : '',
                'Health Score': r.HealthScore ?? '', 'Staff': r.StaffName || '', 'Notes': r.Notes || '',
              }));
              const metricRows = filteredMetrics.map(m => ({
                'Animal': m.AnimalName || '', 'Code': m.AnimalCode || '', 'Species': m.Species || '',
                'Date': m.RecordDate ? new Date(m.RecordDate).toLocaleDateString() : '',
                'Weight': m.Weight ?? '', 'Activity Level': m.ActivityLevel || '',
                'Appetite': m.AppetiteStatus || '', 'Conditions': m.MedicalConditions || '',
                'Treatments': m.RecentTreatments || '',
              }));
              const keeperRows = (data.keepers || []).map(k => ({
                'Animal': k.AnimalName || '', 'Code': k.AnimalCode || '', 'Species': k.Species || '',
                'Keeper': k.KeeperName || '', 'Role': k.AssignmentRole || '',
                'Start Date': k.StartDate ? new Date(k.StartDate).toLocaleDateString() : '',
                'End Date': k.EndDate ? new Date(k.EndDate).toLocaleDateString() : '',
                'Is Primary': k.IsPrimary ? 'Yes' : 'No',
              }));
              const feedingRows = (data.feedings || []).map(f => ({
                'Animal': f.AnimalName || '', 'Code': f.AnimalCode || '', 'Species': f.Species || '',
                'Food Type': f.FoodType || '', 'Quantity': f.Quantity ?? '',
                'Unit': f.Unit || '', 'Frequency': f.Frequency || '',
                'Time': f.FeedingTime || '', 'Instructions': f.SpecialInstructions || '',
              }));
              exportSectionsToSingleSheet([
                { name: 'Health Alerts', data: alertRows },
                { name: 'Health Records', data: recordRows },
                { name: 'Health Metrics', data: metricRows },
                { name: 'Keeper Assignments', data: keeperRows },
                { name: 'Feeding Schedules', data: feedingRows },
              ], 'Health_Report', { reportName: 'Health Report', dateFrom, dateTo });
              toast.success('Health report downloaded.');
            }}
          >
            <Download size={15} /> Download Excel
          </button>
        )}
      </div>

      {loading && <div className="admin-table-empty">Loading health report...</div>}

      {!loading && data && (
        <>
          {/* ── Summary cards ── */}
          <div className="hr-stats-row">
            <div className="hr-stat-card">
              <span className="hr-stat-value">{stats?.TotalAnimals ?? 0}</span>
              <span className="hr-stat-label">Total Animals</span>
            </div>
            <div className="hr-stat-card hr-stat-danger">
              <span className="hr-stat-value">{stats?.UnresolvedAlerts ?? 0}</span>
              <span className="hr-stat-label">Active Alerts</span>
            </div>
            <div className="hr-stat-card hr-stat-green">
              <span className="hr-stat-value">{stats?.AvgHealthScore != null ? Math.round(stats.AvgHealthScore) : '—'}</span>
              <span className="hr-stat-label">Avg Health Score</span>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="hr-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`hr-tab${tab === t.id ? ' hr-tab-active' : ''}`}
                onClick={() => { setTab(t.id); setSearch(''); }}
              >
                {t.icon}
                <span>{t.label}</span>
                <span className="hr-tab-count">
                  {t.id === 'alerts' ? (data.alerts?.length ?? 0)
                    : t.id === 'records' ? (data.records?.length ?? 0)
                    : (data.metrics?.length ?? 0)}
                </span>
              </button>
            ))}
          </div>

          {/* ── Search + filter bar ── */}
          <div className="hr-toolbar">
            <div className="hr-search-wrap">
              <Search size={15} className="hr-search-icon" />
              <input
                type="text"
                placeholder="Search by animal, species, staff, code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="hr-search-input"
              />
            </div>
            <div className="hr-date-filters">
              <label className="hr-date-label">From</label>
              <input type="date" className="hr-date-input" value={dateFrom} max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} onChange={e => setDateFrom(e.target.value)} />
              <label className="hr-date-label">To</label>
              <input type="date" className="hr-date-input" value={dateTo} max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} onChange={e => setDateTo(e.target.value)} />
              {(dateFrom || dateTo) && (
                <button className="hr-filter-btn hr-filter-clear" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear</button>
              )}
            </div>
            {tab === 'alerts' && (
              <div className="hr-filter-group">
                {['all', 'active', 'resolved'].map(f => (
                  <button
                    key={f}
                    className={`hr-filter-btn${alertFilter === f ? ' hr-filter-active' : ''}`}
                    onClick={() => setAlertFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Tab content ── */}
          <div className="admin-table-container">
            {/* ═══ ALERTS TAB ═══ */}
            {tab === 'alerts' && (
              alertSort.sorted.length === 0 ? (
                <div className="admin-table-empty">No health alerts found.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th onClick={() => alertSort.handleSort('AnimalName')} className="hr-sortable">Animal <alertSort.SortIcon col="AnimalName" /></th>
                      <th onClick={() => alertSort.handleSort('Species')} className="hr-sortable">Species <alertSort.SortIcon col="Species" /></th>
                      <th onClick={() => alertSort.handleSort('AlertType')} className="hr-sortable">Type <alertSort.SortIcon col="AlertType" /></th>
                      <th>Message</th>
                      <th onClick={() => alertSort.handleSort('CreatedAt')} className="hr-sortable">Date <alertSort.SortIcon col="CreatedAt" /></th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertSort.sorted.map(al => (
                      <tr key={al.AlertID} className={!al.IsResolved ? 'hr-row-warn' : ''}>
                        <td>
                          <div className="hr-animal-cell">
                            <span className="hr-animal-name">{al.AnimalName || '—'}</span>
                            <span className="hr-animal-code">{al.AnimalCode || ''}</span>
                          </div>
                        </td>
                        <td>{al.Species}</td>
                        <td><span className="hr-alert-type">{al.AlertType}</span></td>
                        <td className="hr-msg-cell">{al.AlertMessage}</td>
                        <td>{fmtDate(al.CreatedAt)}</td>
                        <td>
                          {al.IsResolved
                            ? <span className="hr-badge hr-badge-green"><CheckCircle size={13} /> Resolved</span>
                            : <span className="hr-badge hr-badge-red"><AlertTriangle size={13} /> Active</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* ═══ RECORDS TAB ═══ */}
            {tab === 'records' && (
              recordSort.sorted.length === 0 ? (
                <div className="admin-table-empty">No health records found.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th onClick={() => recordSort.handleSort('AnimalName')} className="hr-sortable">Animal <recordSort.SortIcon col="AnimalName" /></th>
                      <th onClick={() => recordSort.handleSort('Species')} className="hr-sortable">Species <recordSort.SortIcon col="Species" /></th>
                      <th onClick={() => recordSort.handleSort('CheckupDate')} className="hr-sortable">Checkup Date <recordSort.SortIcon col="CheckupDate" /></th>
                      <th onClick={() => recordSort.handleSort('HealthScore')} className="hr-sortable">Score <recordSort.SortIcon col="HealthScore" /></th>
                      <th onClick={() => recordSort.handleSort('StaffName')} className="hr-sortable">Staff <recordSort.SortIcon col="StaffName" /></th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordSort.sorted.map(r => (
                      <tr key={r.RecordID}>
                        <td>
                          <div className="hr-animal-cell">
                            <span className="hr-animal-name">{r.AnimalName || '—'}</span>
                            <span className="hr-animal-code">{r.AnimalCode || ''}</span>
                          </div>
                        </td>
                        <td>{r.Species}</td>
                        <td>{fmtDate(r.CheckupDate)}</td>
                        <td>
                          <span className={`hr-score ${scoreClass(r.HealthScore)}`}>
                            <span className="hr-score-dot" />
                            {r.HealthScore} — {scoreLabel(r.HealthScore)}
                          </span>
                        </td>
                        <td>{r.StaffName || '—'}</td>
                        <td className="hr-notes-cell">{r.Notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* ═══ METRICS TAB ═══ */}
            {tab === 'metrics' && (
              metricSort.sorted.length === 0 ? (
                <div className="admin-table-empty">No health metrics recorded.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th onClick={() => metricSort.handleSort('AnimalName')} className="hr-sortable">Animal <metricSort.SortIcon col="AnimalName" /></th>
                      <th onClick={() => metricSort.handleSort('Species')} className="hr-sortable">Species <metricSort.SortIcon col="Species" /></th>
                      <th onClick={() => metricSort.handleSort('RecordDate')} className="hr-sortable">Date <metricSort.SortIcon col="RecordDate" /></th>
                      <th onClick={() => metricSort.handleSort('Weight')} className="hr-sortable">Weight <metricSort.SortIcon col="Weight" /></th>
                      <th>Range</th>
                      <th onClick={() => metricSort.handleSort('ActivityLevel')} className="hr-sortable">Activity <metricSort.SortIcon col="ActivityLevel" /></th>
                      <th onClick={() => metricSort.handleSort('AppetiteStatus')} className="hr-sortable">Appetite <metricSort.SortIcon col="AppetiteStatus" /></th>
                      <th>Conditions</th>
                      <th>Treatments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricSort.sorted.map(m => {
                      const w = m.Weight;
                      const lo = m.WeightRangeLow;
                      const hi = m.WeightRangeHigh;
                      const outOfRange = w && ((lo && w < lo) || (hi && w > hi));
                      return (
                        <tr key={m.MetricID} className={outOfRange ? 'hr-row-warn' : ''}>
                          <td>
                            <div className="hr-animal-cell">
                              <span className="hr-animal-name">{m.AnimalName || '—'}</span>
                              <span className="hr-animal-code">{m.AnimalCode || ''}</span>
                            </div>
                          </td>
                          <td>{m.Species}</td>
                          <td>{fmtDate(m.RecordDate)}</td>
                          <td style={{ color: outOfRange ? '#ef4444' : 'var(--adm-text-primary)', fontWeight: outOfRange ? 700 : 500 }}>
                            {w != null ? `${Number(w).toFixed(1)} kg` : '—'}
                            {outOfRange && ' ⚠'}
                          </td>
                          <td className="hr-range-cell">
                            {lo || hi ? `${lo ? Number(lo).toFixed(0) : '?'} – ${hi ? Number(hi).toFixed(0) : '?'} kg` : '—'}
                          </td>
                          <td>{m.ActivityLevel || '—'}</td>
                          <td>{m.AppetiteStatus || '—'}</td>
                          <td className="hr-notes-cell">{m.MedicalConditions || '—'}</td>
                          <td className="hr-notes-cell">{m.RecentTreatments || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}

          </div>
        </>
      )}
    </div>
  );
};

export default HealthReport;
