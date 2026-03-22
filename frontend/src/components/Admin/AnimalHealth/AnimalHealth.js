import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '../AdminTable.css';
import './AnimalHealth.css';
import {
  HeartPulse, Search, Plus, Edit2, Trash2, Activity, AlertTriangle,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  CheckCircle, Bell, Scale, Clipboard, X
} from 'lucide-react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getPaginationRowModel, flexRender
} from '@tanstack/react-table';
import { toast } from 'sonner';
import AdminModalForm from '../AdminModalForm';
import DatePickerInput from '../DatePickerInput';
import AdminSelect from '../AdminSelect';
import {
  getAllHealthRecords, createHealthRecord, updateHealthRecord, deleteHealthRecord,
  getAllHealthMetrics, createHealthMetric, updateHealthMetric, deleteHealthMetric,
  getHealthAlerts, resolveHealthAlert,
  getAnimalsForDropdown, getStaffForDropdown
} from '../../../services/animalHealthService';

/* ── Helpers ─────────────────────────────────────────────────── */
const SortIcon = ({ column }) => {
  if (!column.getCanSort()) return null;
  return (
    <span className="sort-icon">
      {column.getIsSorted() === 'asc' ? <ChevronUp size={12} /> :
       column.getIsSorted() === 'desc' ? <ChevronDown size={12} /> :
       <ChevronsUpDown size={12} />}
    </span>
  );
};

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

/* ── Shared Paginated Table ──────────────────────────────────── */
const DataTable = ({ data, columns, sorting, setSorting, loading, emptyText }) => {
  const table = useReactTable({
    data, columns, state: { sorting }, onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });
  return (
    <>
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-table-empty">Loading...</div>
        ) : data.length === 0 ? (
          <div className="admin-table-empty">{emptyText}</div>
        ) : (
          <table className="admin-table">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id} style={{ width: h.column.getSize() !== 150 ? h.column.getSize() : undefined, cursor: h.column.getCanSort() ? 'pointer' : 'default' }} onClick={h.column.getToggleSortingHandler()}>
                      <div className="th-content">{flexRender(h.column.columnDef.header, h.getContext())}<SortIcon column={h.column} /></div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!loading && data.length > 0 && table.getPageCount() > 1 && (
        <div className="admin-table-pagination">
          <span className="admin-pagination-info">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="admin-pagination-controls">
            <button className="admin-pagination-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: table.getPageCount() }, (_, i) => (
              <button key={i} className={`admin-pagination-btn${table.getState().pagination.pageIndex === i ? ' active' : ''}`}
                onClick={() => table.setPageIndex(i)}>{i + 1}</button>
            ))}
            <button className="admin-pagination-btn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const AnimalHealth = () => {
  const [activeTab, setActiveTab] = useState('records');
  const [search, setSearch] = useState('');

  // Dropdowns
  const [animals, setAnimals] = useState([]);
  const [staff, setStaff] = useState([]);

  // Records
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsSorting, setRecordsSorting] = useState([{ id: 'CheckupDate', desc: true }]);
  const [recordModal, setRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordForm, setRecordForm] = useState({ AnimalID: '', CheckupDate: '', HealthScore: '', Notes: '', StaffID: '' });

  // Metrics
  const [metrics, setMetrics] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsSorting, setMetricsSorting] = useState([{ id: 'RecordDate', desc: true }]);
  const [metricModal, setMetricModal] = useState(false);
  const [editingMetric, setEditingMetric] = useState(null);
  const [metricForm, setMetricForm] = useState({
    AnimalID: '', RecordDate: '', ActivityLevel: '', Weight: '',
    WeightRangeLow: '', WeightRangeHigh: '', MedicalConditions: '',
    RecentTreatments: '', AppetiteStatus: '', Notes: ''
  });

  // Alerts
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertSubTab, setAlertSubTab] = useState('current');

  /* ── Load data ─────────────────────────────────────────── */
  const loadAll = useCallback(async () => {
    try {
      const [animalList, staffList] = await Promise.all([
        getAnimalsForDropdown(), getStaffForDropdown()
      ]);
      setAnimals(animalList);
      setStaff(staffList);
    } catch { /* non-fatal */ }

    try { setRecordsLoading(true); setRecords(await getAllHealthRecords()); }
    catch (e) { toast.error(e.message || 'Failed to load health records.'); }
    finally { setRecordsLoading(false); }

    try { setMetricsLoading(true); setMetrics(await getAllHealthMetrics()); }
    catch (e) { toast.error(e.message || 'Failed to load health metrics.'); }
    finally { setMetricsLoading(false); }

    try { setAlertsLoading(true); setAlerts(await getHealthAlerts()); }
    catch (e) { /* alerts table may not exist yet */ }
    finally { setAlertsLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Filtered data ─────────────────────────────────────── */
  const filteredRecords = useMemo(() => records.filter(r =>
    r.AnimalName?.toLowerCase().includes(search.toLowerCase()) ||
    r.Species?.toLowerCase().includes(search.toLowerCase()) ||
    String(r.HealthScore).includes(search)
  ), [records, search]);

  const filteredMetrics = useMemo(() => metrics.filter(m =>
    m.AnimalName?.toLowerCase().includes(search.toLowerCase()) ||
    m.Species?.toLowerCase().includes(search.toLowerCase()) ||
    m.ActivityLevel?.toLowerCase().includes(search.toLowerCase()) ||
    m.AppetiteStatus?.toLowerCase().includes(search.toLowerCase())
  ), [metrics, search]);

  const filteredAlerts = useMemo(() => alerts.filter(a =>
    a.AnimalName?.toLowerCase().includes(search.toLowerCase()) ||
    a.AlertType?.toLowerCase().includes(search.toLowerCase()) ||
    a.AlertMessage?.toLowerCase().includes(search.toLowerCase())
  ), [alerts, search]);

  /* ── Stats ─────────────────────────────────────────────── */
  const avgScore = records.length ? Math.round(records.reduce((s, r) => s + r.HealthScore, 0) / records.length) : 0;
  const criticalCount = records.filter(r => r.HealthScore < 40).length;
  const unresolvedAlerts = alerts.filter(a => !a.IsResolved).length;
  const outOfRangeCount = metrics.filter(m => m.Weight && ((m.WeightRangeLow && m.Weight < m.WeightRangeLow) || (m.WeightRangeHigh && m.Weight > m.WeightRangeHigh))).length;

  /* ── Record CRUD ───────────────────────────────────────── */
  const openRecordModal = (rec = null) => {
    if (rec) {
      setEditingRecord(rec);
      setRecordForm({
        AnimalID: String(rec.AnimalID), CheckupDate: rec.CheckupDate ? rec.CheckupDate.split('T')[0] : '',
        HealthScore: String(rec.HealthScore), Notes: rec.Notes || '', StaffID: String(rec.StaffID)
      });
    } else {
      setEditingRecord(null);
      setRecordForm({ AnimalID: '', CheckupDate: new Date().toISOString().split('T')[0], HealthScore: '', Notes: '', StaffID: '' });
    }
    setRecordModal(true);
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await updateHealthRecord(editingRecord.RecordID, recordForm);
        toast.success('Health record updated.');
      } else {
        await createHealthRecord(recordForm);
        toast.success('Health record created.');
      }
      setRecordModal(false);
      await loadAll();
    } catch (err) { toast.error(err.message || 'Failed to save health record.'); }
  };

  const handleRecordDelete = async (id) => {
    if (!window.confirm('Delete this health record?')) return;
    try { await deleteHealthRecord(id); toast.success('Health record deleted.'); await loadAll(); }
    catch (err) { toast.error(err.message || 'Failed to delete.'); }
  };

  /* ── Metric CRUD ───────────────────────────────────────── */
  const openMetricModal = (met = null) => {
    if (met) {
      setEditingMetric(met);
      setMetricForm({
        AnimalID: String(met.AnimalID), RecordDate: met.RecordDate ? met.RecordDate.split('T')[0] : '',
        ActivityLevel: met.ActivityLevel || '', Weight: met.Weight != null ? String(met.Weight) : '',
        WeightRangeLow: met.WeightRangeLow != null ? String(met.WeightRangeLow) : '',
        WeightRangeHigh: met.WeightRangeHigh != null ? String(met.WeightRangeHigh) : '',
        MedicalConditions: met.MedicalConditions || '', RecentTreatments: met.RecentTreatments || '',
        AppetiteStatus: met.AppetiteStatus || '', Notes: met.Notes || ''
      });
    } else {
      setEditingMetric(null);
      setMetricForm({
        AnimalID: '', RecordDate: new Date().toISOString().split('T')[0], ActivityLevel: '', Weight: '',
        WeightRangeLow: '', WeightRangeHigh: '', MedicalConditions: '', RecentTreatments: '',
        AppetiteStatus: '', Notes: ''
      });
    }
    setMetricModal(true);
  };

  const handleMetricSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...metricForm };
      if (payload.Weight === '') payload.Weight = null;
      if (payload.WeightRangeLow === '') payload.WeightRangeLow = null;
      if (payload.WeightRangeHigh === '') payload.WeightRangeHigh = null;
      if (editingMetric) {
        await updateHealthMetric(editingMetric.MetricID, payload);
        toast.success('Health metric updated.');
      } else {
        await createHealthMetric(payload);
        toast.success('Health metric created.');
      }
      setMetricModal(false);
      await loadAll();
    } catch (err) { toast.error(err.message || 'Failed to save health metric.'); }
  };

  const handleMetricDelete = async (id) => {
    if (!window.confirm('Delete this health metric?')) return;
    try { await deleteHealthMetric(id); toast.success('Health metric deleted.'); await loadAll(); }
    catch (err) { toast.error(err.message || 'Failed to delete.'); }
  };

  /* ── Alert resolve ─────────────────────────────────────── */
  const handleResolveAlert = async (id) => {
    try { await resolveHealthAlert(id); toast.success('Alert resolved.'); await loadAll(); }
    catch (err) { toast.error(err.message || 'Failed to resolve alert.'); }
  };

  /* ── Column definitions ────────────────────────────────── */
  const recordColumns = useMemo(() => [
    { accessorKey: 'AnimalName', header: 'Animal', cell: ({ row }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontWeight: 600 }}>{row.original.AnimalName}</span>
        <span style={{ fontSize: '0.76rem', color: 'var(--adm-text-secondary)' }}>{row.original.Species}</span>
      </div>
    )},
    { accessorKey: 'CheckupDate', header: 'Checkup Date', cell: info => fmtDate(info.getValue()) },
    { accessorKey: 'HealthScore', header: 'Health Score', size: 130, cell: info => {
      const v = info.getValue();
      return (
        <span className={`ah-score ${scoreClass(v)}`}>
          <span className="ah-score-dot" />{v} — {scoreLabel(v)}
        </span>
      );
    }},
    { accessorKey: 'StaffName', header: 'Vet / Staff', cell: info => info.getValue() || '—' },
    { accessorKey: 'Notes', header: 'Notes', cell: info => (
      <span style={{ fontSize: '0.82rem', color: 'var(--adm-text-secondary)', maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {info.getValue() || '—'}
      </span>
    )},
    { id: 'actions', header: 'Actions', enableSorting: false, size: 100, cell: ({ row }) => (
      <div className="action-buttons">
        <button className="action-btn edit" onClick={() => openRecordModal(row.original)}><Edit2 size={16} /></button>
        <button className="action-btn delete" onClick={() => handleRecordDelete(row.original.RecordID)}><Trash2 size={16} /></button>
      </div>
    )},
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [animals, staff]);

  const metricColumns = useMemo(() => [
    { accessorKey: 'AnimalName', header: 'Animal', cell: ({ row }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontWeight: 600 }}>{row.original.AnimalName}</span>
        <span style={{ fontSize: '0.76rem', color: 'var(--adm-text-secondary)' }}>{row.original.Species}</span>
      </div>
    )},
    { accessorKey: 'RecordDate', header: 'Date', cell: info => fmtDate(info.getValue()) },
    { accessorKey: 'Weight', header: 'Weight (kg)', size: 140, cell: ({ row }) => {
      const w = row.original.Weight;
      const lo = row.original.WeightRangeLow;
      const hi = row.original.WeightRangeHigh;
      if (w == null) return '—';
      const outOfRange = (lo && w < lo) || (hi && w > hi);
      return (
        <span className={outOfRange ? 'ah-weight-flag' : 'ah-weight-flag ah-weight-ok'}>
          {outOfRange && <AlertTriangle size={13} />}
          {Number(w).toFixed(1)}
          {(lo || hi) && <span style={{ fontWeight: 400, fontSize: '0.72rem', color: 'var(--adm-text-muted)' }}> ({lo ? Number(lo).toFixed(0) : '?'}-{hi ? Number(hi).toFixed(0) : '?'})</span>}
        </span>
      );
    }},
    { accessorKey: 'ActivityLevel', header: 'Activity', cell: info => info.getValue() || '—' },
    { accessorKey: 'AppetiteStatus', header: 'Appetite', cell: info => info.getValue() || '—' },
    { accessorKey: 'MedicalConditions', header: 'Conditions', cell: info => (
      <span style={{ fontSize: '0.82rem', color: 'var(--adm-text-secondary)', maxWidth: 180, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {info.getValue() || '—'}
      </span>
    )},
    { id: 'actions', header: 'Actions', enableSorting: false, size: 100, cell: ({ row }) => (
      <div className="action-buttons">
        <button className="action-btn edit" onClick={() => openMetricModal(row.original)}><Edit2 size={16} /></button>
        <button className="action-btn delete" onClick={() => handleMetricDelete(row.original.MetricID)}><Trash2 size={16} /></button>
      </div>
    )},
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [animals]);

  /* ── Animal / Staff dropdown options ───────────────────── */
  const animalOptions = animals.map(a => ({ value: String(a.AnimalID), label: `${a.Name} (${a.Species})` }));
  const staffOptions = staff.map(s => ({ value: String(s.StaffID), label: `${s.FullName} — ${s.Role}` }));

  /* ── Active count for toolbar ──────────────────────────── */
  const activeCount = activeTab === 'records' ? filteredRecords.length : activeTab === 'metrics' ? filteredMetrics.length : filteredAlerts.length;

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title"><HeartPulse size={22} className="title-icon" /> Animal Health Tracking</h1>
          <p className="admin-page-subtitle">Monitor health records, body metrics, and alerts for all animals</p>
        </div>
        <div className="admin-page-actions">
          {activeTab === 'records' && (
            <button className="admin-btn-primary" onClick={() => openRecordModal()}>
              <Plus size={16} /> New Record
            </button>
          )}
          {activeTab === 'metrics' && (
            <button className="admin-btn-primary" onClick={() => openMetricModal()}>
              <Plus size={16} /> New Metric
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="ah-stats-row">
        <div className="ah-stat-card">
          <span className="ah-stat-label">Avg Health Score</span>
          <span className="ah-stat-value">{avgScore}<span style={{ fontSize: '0.8rem', fontWeight: 500 }}>/100</span></span>
          <span className="ah-stat-sub">{scoreLabel(avgScore)}</span>
        </div>
        <div className="ah-stat-card">
          <span className="ah-stat-label">Critical Animals</span>
          <span className="ah-stat-value" style={{ color: criticalCount > 0 ? '#ef4444' : 'inherit' }}>{criticalCount}</span>
          <span className="ah-stat-sub">Score below 40</span>
        </div>
        <div className="ah-stat-card">
          <span className="ah-stat-label">Weight Alerts</span>
          <span className="ah-stat-value" style={{ color: outOfRangeCount > 0 ? '#f59e0b' : 'inherit' }}>{outOfRangeCount}</span>
          <span className="ah-stat-sub">Out of expected range</span>
        </div>
        <div className="ah-stat-card">
          <span className="ah-stat-label">Unresolved Alerts</span>
          <span className="ah-stat-value" style={{ color: unresolvedAlerts > 0 ? '#ef4444' : 'inherit' }}>{unresolvedAlerts}</span>
          <span className="ah-stat-sub">Triggered by system</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="ah-tabs">
        <button className={`ah-tab${activeTab === 'records' ? ' active' : ''}`} onClick={() => { setActiveTab('records'); setSearch(''); }}>
          <Clipboard size={14} /> Health Records <span className="ah-badge">{records.length}</span>
        </button>
        <button className={`ah-tab${activeTab === 'metrics' ? ' active' : ''}`} onClick={() => { setActiveTab('metrics'); setSearch(''); }}>
          <Scale size={14} /> Health Metrics <span className="ah-badge">{metrics.length}</span>
        </button>
        <button className={`ah-tab${activeTab === 'alerts' ? ' active' : ''}`} onClick={() => { setActiveTab('alerts'); setSearch(''); }}>
          <Bell size={14} /> Alerts {unresolvedAlerts > 0 && <span className="ah-badge" style={{ background: '#ef4444', color: '#fff' }}>{unresolvedAlerts}</span>}
        </button>
      </div>

      {/* Toolbar */}
      <div className="admin-table-toolbar">
        <div className="admin-search-container">
          <Search size={15} className="search-icon" />
          <input className="admin-search-input" placeholder="Search by animal, species, or keyword..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="dr-count">{activeCount} result{activeCount !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Records Tab ──────────────────────────────────── */}
      {activeTab === 'records' && (
        <DataTable data={filteredRecords} columns={recordColumns} sorting={recordsSorting}
          setSorting={setRecordsSorting} loading={recordsLoading} emptyText={search ? 'No matching records.' : 'No health records yet.'} />
      )}

      {/* ── Metrics Tab ──────────────────────────────────── */}
      {activeTab === 'metrics' && (
        <DataTable data={filteredMetrics} columns={metricColumns} sorting={metricsSorting}
          setSorting={setMetricsSorting} loading={metricsLoading} emptyText={search ? 'No matching metrics.' : 'No health metrics yet.'} />
      )}

      {/* ── Alerts Tab ───────────────────────────────────── */}
      {activeTab === 'alerts' && (
        alertsLoading ? (
          <div className="admin-table-empty">Loading alerts...</div>
        ) : (
          <>
            <div className="ah-alert-subtabs">
              <button className={`ah-alert-subtab${alertSubTab === 'current' ? ' active' : ''}`}
                onClick={() => setAlertSubTab('current')}>
                <AlertTriangle size={13} /> Current
                {filteredAlerts.filter(a => !a.IsResolved).length > 0 && (
                  <span className="ah-subtab-count">{filteredAlerts.filter(a => !a.IsResolved).length}</span>
                )}
              </button>
              <button className={`ah-alert-subtab${alertSubTab === 'resolved' ? ' active' : ''}`}
                onClick={() => setAlertSubTab('resolved')}>
                <CheckCircle size={13} /> Resolved
                {filteredAlerts.filter(a => a.IsResolved).length > 0 && (
                  <span className="ah-subtab-count resolved">{filteredAlerts.filter(a => a.IsResolved).length}</span>
                )}
              </button>
            </div>
            {(() => {
              const visibleAlerts = filteredAlerts.filter(a => alertSubTab === 'current' ? !a.IsResolved : a.IsResolved);
              if (visibleAlerts.length === 0) {
                return (
                  <div className="ah-empty">
                    <CheckCircle size={40} style={{ color: '#22c55e' }} />
                    <p>{alertSubTab === 'current' ? 'No active alerts. All clear!' : 'No resolved alerts yet.'}</p>
                  </div>
                );
              }
              return (
                <div className="ah-alert-list">
                  {visibleAlerts.map(a => (
                    <div key={a.AlertID} className={`ah-alert-card ${a.IsResolved ? 'resolved' : 'unresolved'}`}>
                      <div className="ah-alert-icon">
                        {a.IsResolved ? <CheckCircle size={18} color="#22c55e" /> : <AlertTriangle size={18} color="#ef4444" />}
                      </div>
                      <div className="ah-alert-body">
                        <div className="ah-alert-type">{a.AlertType} — {a.AnimalName} ({a.Species})</div>
                        <div className="ah-alert-msg">{a.AlertMessage}</div>
                        <div className="ah-alert-time">{fmtDate(a.CreatedAt)}</div>
                      </div>
                      {!a.IsResolved ? (
                        <button className="ah-alert-resolve-btn" onClick={() => handleResolveAlert(a.AlertID)}>
                          <CheckCircle size={13} /> Resolve
                        </button>
                      ) : (
                        <span className="ah-resolved-badge">Resolved {a.ResolvedAt ? fmtDate(a.ResolvedAt) : ''}</span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </>
        )
      )}

      {/* ══════ Record Modal ══════ */}
      <AdminModalForm title={editingRecord ? 'Edit Health Record' : 'New Health Record'} isOpen={recordModal} onClose={() => setRecordModal(false)} onSubmit={handleRecordSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Animal *</label>
            <AdminSelect value={recordForm.AnimalID} onChange={v => setRecordForm(p => ({ ...p, AnimalID: v }))}
              options={animalOptions} placeholder="Select animal..." />
          </div>
          <div className="form-group">
            <label>Vet / Staff *</label>
            <AdminSelect value={recordForm.StaffID} onChange={v => setRecordForm(p => ({ ...p, StaffID: v }))}
              options={staffOptions} placeholder="Select staff..." />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Checkup Date *</label>
            <DatePickerInput value={recordForm.CheckupDate} onChange={v => setRecordForm(p => ({ ...p, CheckupDate: v }))} />
          </div>
          <div className="form-group">
            <label>Health Score (0-100) *</label>
            <input type="number" min="0" max="100"
              value={recordForm.HealthScore} onChange={e => setRecordForm(p => ({ ...p, HealthScore: e.target.value }))} placeholder="e.g. 85" />
          </div>
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea rows={3} value={recordForm.Notes}
            onChange={e => setRecordForm(p => ({ ...p, Notes: e.target.value }))} placeholder="Optional checkup notes..." />
        </div>
      </AdminModalForm>

      {/* ══════ Metric Modal ══════ */}
      <AdminModalForm title={editingMetric ? 'Edit Health Metric' : 'New Health Metric'} isOpen={metricModal} onClose={() => setMetricModal(false)} onSubmit={handleMetricSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Animal *</label>
            <AdminSelect value={metricForm.AnimalID} onChange={v => setMetricForm(p => ({ ...p, AnimalID: v }))}
              options={animalOptions} placeholder="Select animal..." />
          </div>
          <div className="form-group">
            <label>Record Date *</label>
            <DatePickerInput value={metricForm.RecordDate} onChange={v => setMetricForm(p => ({ ...p, RecordDate: v }))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Weight (kg)</label>
            <input type="number" step="0.01" value={metricForm.Weight}
              onChange={e => setMetricForm(p => ({ ...p, Weight: e.target.value }))} placeholder="e.g. 120.5" />
          </div>
          <div className="form-group">
            <label>Activity Level</label>
            <AdminSelect value={metricForm.ActivityLevel} onChange={v => setMetricForm(p => ({ ...p, ActivityLevel: v }))}
              options={['High', 'Normal', 'Low', 'Sedentary']} placeholder="Select level..." />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Weight Range Low (kg)</label>
            <input type="number" step="0.01" value={metricForm.WeightRangeLow}
              onChange={e => setMetricForm(p => ({ ...p, WeightRangeLow: e.target.value }))} placeholder="Min expected" />
          </div>
          <div className="form-group">
            <label>Weight Range High (kg)</label>
            <input type="number" step="0.01" value={metricForm.WeightRangeHigh}
              onChange={e => setMetricForm(p => ({ ...p, WeightRangeHigh: e.target.value }))} placeholder="Max expected" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Appetite Status</label>
            <AdminSelect value={metricForm.AppetiteStatus} onChange={v => setMetricForm(p => ({ ...p, AppetiteStatus: v }))}
              options={['Normal', 'Increased', 'Decreased', 'None']} placeholder="Select..." />
          </div>
          <div className="form-group">
            <label>Medical Conditions</label>
            <input value={metricForm.MedicalConditions}
              onChange={e => setMetricForm(p => ({ ...p, MedicalConditions: e.target.value }))} placeholder="e.g. Arthritis, skin rash" />
          </div>
        </div>
        <div className="form-group">
          <label>Recent Treatments</label>
          <input value={metricForm.RecentTreatments}
            onChange={e => setMetricForm(p => ({ ...p, RecentTreatments: e.target.value }))} placeholder="e.g. Antibiotics course, surgery" />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea rows={3} value={metricForm.Notes}
            onChange={e => setMetricForm(p => ({ ...p, Notes: e.target.value }))} placeholder="Additional observations..." />
        </div>
      </AdminModalForm>
    </div>
  );
};

export default AnimalHealth;
