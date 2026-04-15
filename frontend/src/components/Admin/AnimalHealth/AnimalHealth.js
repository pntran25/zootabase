import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '../AdminTable.css';
import './AnimalHealth.css';
import {
  HeartPulse, Search, Plus, Edit2, Trash2, AlertTriangle,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  CheckCircle, Bell, Clipboard
} from 'lucide-react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getPaginationRowModel, getExpandedRowModel, flexRender
} from '@tanstack/react-table';
import { toast } from 'sonner';
import AdminModalForm from '../AdminModalForm';
import DatePickerInput from '../DatePickerInput';
import AdminSelect from '../AdminSelect';
import {
  getAllHealthRecords, createHealthRecord, updateHealthRecord, deleteHealthRecord,
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

/* ── Health Assessment Scoring ─────────────────────────────── */
const HEALTH_CATEGORIES = [
  { key: 'BodyCondition', label: 'Body Condition', max: 25, options: [
    { label: 'Ideal', value: 25 }, { label: 'Slightly Over/Under', value: 15 }, { label: 'Over/Underweight', value: 5 },
  ]},
  { key: 'ActivityLevel', label: 'Activity Level', max: 20, options: [
    { label: 'Normal / High', value: 20 }, { label: 'Low', value: 10 }, { label: 'Sedentary', value: 5 },
  ]},
  { key: 'Appetite', label: 'Appetite', max: 20, options: [
    { label: 'Normal', value: 20 }, { label: 'Increased', value: 15 }, { label: 'Decreased', value: 10 }, { label: 'None', value: 0 },
  ]},
  { key: 'Hydration', label: 'Hydration', max: 15, options: [
    { label: 'Normal', value: 15 }, { label: 'Mild Dehydration', value: 8 }, { label: 'Dehydrated', value: 3 },
  ]},
  { key: 'Behavior', label: 'Behavior / Temperament', max: 20, options: [
    { label: 'Alert / Normal', value: 20 }, { label: 'Slightly Lethargic', value: 12 }, { label: 'Lethargic', value: 5 }, { label: 'Distressed', value: 0 },
  ]},
];

const calcHealthScore = (assess) => {
  let filled = 0;
  let total = 0;
  for (const cat of HEALTH_CATEGORIES) {
    if (assess[cat.key] !== '') { filled++; total += Number(assess[cat.key]); }
  }
  return filled === HEALTH_CATEGORIES.length ? total : null;
};

const defaultAssessment = () => HEALTH_CATEGORIES.reduce((o, c) => ({ ...o, [c.key]: '' }), {});

/* ── Shared Paginated Table ──────────────────────────────────── */
const DataTable = ({ data, columns, sorting, setSorting, loading, emptyText, renderExpandedRow }) => {
  const [expanded, setExpanded] = useState({});
  const table = useReactTable({
    data, columns, state: { sorting, expanded }, onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
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
                <React.Fragment key={row.id}>
                  <tr className={`${renderExpandedRow ? 'ah-expandable-row' : ''} ${row.getIsExpanded() ? 'ah-row-expanded' : ''}`}
                    onClick={renderExpandedRow ? () => row.toggleExpanded() : undefined}
                    style={renderExpandedRow ? { cursor: 'pointer' } : undefined}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                  {renderExpandedRow && row.getIsExpanded() && (
                    <tr className="ah-expanded-detail-row">
                      <td colSpan={row.getVisibleCells().length}>
                        {renderExpandedRow(row.original)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
  const [recordForm, setRecordForm] = useState({
    AnimalID: '', CheckupDate: '', HealthScore: '', Notes: '', StaffID: '',
    ActivityLevel: '', Weight: '', WeightRangeLow: '', WeightRangeHigh: '',
    MedicalConditions: '', RecentTreatments: '', AppetiteStatus: ''
  });
  const [assessment, setAssessment] = useState(defaultAssessment());

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

  const filteredAlerts = useMemo(() => alerts.filter(a =>
    a.AnimalName?.toLowerCase().includes(search.toLowerCase()) ||
    a.AlertType?.toLowerCase().includes(search.toLowerCase()) ||
    a.AlertMessage?.toLowerCase().includes(search.toLowerCase())
  ), [alerts, search]);

  /* ── Stats ─────────────────────────────────────────────── */
  const avgScore = records.length ? Math.round(records.reduce((s, r) => s + r.HealthScore, 0) / records.length) : 0;
  const criticalCount = records.filter(r => r.HealthScore < 40).length;
  const unresolvedAlerts = alerts.filter(a => !a.IsResolved).length;
  const outOfRangeCount = records.filter(r => r.Weight && ((r.WeightRangeLow && r.Weight < r.WeightRangeLow) || (r.WeightRangeHigh && r.Weight > r.WeightRangeHigh))).length;

  /* ── Record CRUD ───────────────────────────────────────── */
  const openRecordModal = (rec = null) => {
    if (rec) {
      setEditingRecord(rec);
      setRecordForm({
        AnimalID: String(rec.AnimalID), CheckupDate: rec.CheckupDate ? rec.CheckupDate.split('T')[0] : '',
        HealthScore: String(rec.HealthScore), Notes: rec.Notes || '', StaffID: String(rec.StaffID),
        ActivityLevel: rec.ActivityLevel || '', Weight: rec.Weight != null ? String(rec.Weight) : '',
        WeightRangeLow: rec.WeightRangeLow != null ? String(rec.WeightRangeLow) : '',
        WeightRangeHigh: rec.WeightRangeHigh != null ? String(rec.WeightRangeHigh) : '',
        MedicalConditions: rec.MedicalConditions || '', RecentTreatments: rec.RecentTreatments || '',
        AppetiteStatus: rec.AppetiteStatus || ''
      });
      setAssessment(defaultAssessment());
    } else {
      setEditingRecord(null);
      setRecordForm({
        AnimalID: '', CheckupDate: new Date().toISOString().split('T')[0], HealthScore: '', Notes: '', StaffID: '',
        ActivityLevel: '', Weight: '', WeightRangeLow: '', WeightRangeHigh: '',
        MedicalConditions: '', RecentTreatments: '', AppetiteStatus: ''
      });
      setAssessment(defaultAssessment());
    }
    setRecordModal(true);
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    const computedScore = calcHealthScore(assessment);
    if (computedScore == null) {
      toast.error('Please fill in all health assessment categories.');
      return;
    }
    const payload = { ...recordForm, HealthScore: String(computedScore) };
    if (payload.Weight === '') payload.Weight = null;
    if (payload.WeightRangeLow === '') payload.WeightRangeLow = null;
    if (payload.WeightRangeHigh === '') payload.WeightRangeHigh = null;
    try {
      if (editingRecord) {
        await updateHealthRecord(editingRecord.RecordID, payload);
        toast.success('Health record updated.');
      } else {
        await createHealthRecord(payload);
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

  /* ── Alert resolve ─────────────────────────────────────── */
  const handleResolveAlert = async (id) => {
    try { await resolveHealthAlert(id); toast.success('Alert resolved.'); await loadAll(); }
    catch (err) { toast.error(err.message || 'Failed to resolve alert.'); }
  };

  /* ── Column definitions ────────────────────────────────── */
  const recordColumns = useMemo(() => [
    { id: 'expand', header: '', enableSorting: false, size: 36, cell: ({ row }) => (
      <span className="ah-expand-chevron" onClick={e => { e.stopPropagation(); row.toggleExpanded(); }}>
        {row.getIsExpanded() ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </span>
    )},
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
    { accessorKey: 'Weight', header: 'Weight (kg)', size: 120, cell: ({ row }) => {
      const w = row.original.Weight;
      const lo = row.original.WeightRangeLow;
      const hi = row.original.WeightRangeHigh;
      if (w == null) return '—';
      const outOfRange = (lo && w < lo) || (hi && w > hi);
      return (
        <span className={outOfRange ? 'ah-weight-flag' : 'ah-weight-flag ah-weight-ok'}>
          {outOfRange && <AlertTriangle size={13} />}
          {Number(w).toFixed(1)}
        </span>
      );
    }},
    { id: 'actions', header: 'Actions', enableSorting: false, size: 100, cell: ({ row }) => (
      <div className="action-buttons">
        <button className="action-btn edit" onClick={() => openRecordModal(row.original)}><Edit2 size={16} /></button>
        <button className="action-btn delete" onClick={() => handleRecordDelete(row.original.RecordID)}><Trash2 size={16} /></button>
      </div>
    )},
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [animals, staff]);

  /* ── Animal / Staff dropdown options ───────────────────── */
  const animalOptions = animals.map(a => ({ value: String(a.AnimalID), label: `${a.Name} (${a.Species})` }));
  const staffOptions = staff.map(s => ({ value: String(s.StaffID), label: `${s.FullName} — ${s.Role}` }));

  /* ── Active count for toolbar ──────────────────────────── */
  const activeCount = activeTab === 'records' ? filteredRecords.length : filteredAlerts.length;

  /* ── Expanded row detail renderer ──────────────────────── */
  const renderRecordDetail = useCallback((rec) => {
    const hasMetrics = rec.ActivityLevel || rec.Weight != null || rec.AppetiteStatus ||
      rec.MedicalConditions || rec.RecentTreatments;
    return (
      <div className="ah-detail-panel">
        <div className="ah-detail-grid">
          <div className="ah-detail-item">
            <span className="ah-detail-label">Activity Level</span>
            <span className="ah-detail-value">{rec.ActivityLevel || '—'}</span>
          </div>
          <div className="ah-detail-item">
            <span className="ah-detail-label">Appetite Status</span>
            <span className="ah-detail-value">{rec.AppetiteStatus || '—'}</span>
          </div>
          <div className="ah-detail-item">
            <span className="ah-detail-label">Weight</span>
            <span className="ah-detail-value">
              {rec.Weight != null ? `${Number(rec.Weight).toFixed(1)} kg` : '—'}
              {rec.WeightRangeLow != null && rec.WeightRangeHigh != null && (
                <span className="ah-detail-range"> (range: {Number(rec.WeightRangeLow).toFixed(1)}–{Number(rec.WeightRangeHigh).toFixed(1)})</span>
              )}
            </span>
          </div>
          <div className="ah-detail-item">
            <span className="ah-detail-label">Medical Conditions</span>
            <span className="ah-detail-value">{rec.MedicalConditions || '—'}</span>
          </div>
          <div className="ah-detail-item">
            <span className="ah-detail-label">Recent Treatments</span>
            <span className="ah-detail-value">{rec.RecentTreatments || '—'}</span>
          </div>
          <div className="ah-detail-item">
            <span className="ah-detail-label">Health Score</span>
            <span className="ah-detail-value">
              <span className={`ah-score ${scoreClass(rec.HealthScore)}`}>
                <span className="ah-score-dot" />{rec.HealthScore}/100 — {scoreLabel(rec.HealthScore)}
              </span>
            </span>
          </div>
        </div>
        {rec.Notes && (
          <div className="ah-detail-notes">
            <span className="ah-detail-label">Notes</span>
            <p>{rec.Notes}</p>
          </div>
        )}
        {!hasMetrics && (
          <p className="ah-detail-empty">No additional metrics recorded for this checkup.</p>
        )}
      </div>
    );
  }, []);

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
          setSorting={setRecordsSorting} loading={recordsLoading} emptyText={search ? 'No matching records.' : 'No health records yet.'}
          renderExpandedRow={renderRecordDetail} />
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
              options={animalOptions} placeholder="Select animal..." searchable />
          </div>
          <div className="form-group">
            <label>Vet / Staff *</label>
            <AdminSelect value={recordForm.StaffID} onChange={v => setRecordForm(p => ({ ...p, StaffID: v }))}
              options={staffOptions} placeholder="Select staff..." searchable />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Checkup Date *</label>
            <DatePickerInput value={recordForm.CheckupDate} onChange={v => setRecordForm(p => ({ ...p, CheckupDate: v }))} />
          </div>
        </div>

        <div className="ah-assess-section">
          <label className="ah-assess-title">Health Assessment *</label>
          <div className="ah-assess-grid">
            {HEALTH_CATEGORIES.map(cat => (
              <div key={cat.key} className="ah-assess-category">
                <span className="ah-assess-label">{cat.label} <span className="ah-assess-pts">({cat.max} pts)</span></span>
                <div className="ah-assess-options">
                  {cat.options.map(opt => (
                    <button type="button" key={opt.value}
                      className={`ah-assess-btn${assessment[cat.key] === String(opt.value) ? ' active ' + scoreClass(opt.value / cat.max * 100) : ''}`}
                      onClick={() => setAssessment(p => ({ ...p, [cat.key]: String(opt.value) }))}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {(() => {
            const s = calcHealthScore(assessment);
            return s != null ? (
              <div className="ah-assess-result">
                <span className={`ah-score-hint ${scoreClass(s)}`}>
                  Calculated Score: {s}/100 — {scoreLabel(s)}
                </span>
                <div className="ah-score-guide">
                  <span className="ah-score-guide-item ah-score-excellent">90-100 Excellent</span>
                  <span className="ah-score-guide-item ah-score-good">65-89 Good</span>
                  <span className="ah-score-guide-item ah-score-fair">40-64 Fair</span>
                  <span className="ah-score-guide-item ah-score-critical">0-39 Critical</span>
                </div>
              </div>
            ) : (
              <p className="ah-assess-hint-text">Select all categories to calculate the health score.</p>
            );
          })()}
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea rows={3} value={recordForm.Notes}
            onChange={e => setRecordForm(p => ({ ...p, Notes: e.target.value }))} placeholder="Optional checkup notes..." />
        </div>

        <div className="ah-assess-section" style={{ marginTop: 8 }}>
          <label className="ah-assess-title">Body Metrics (optional)</label>
          <div className="form-row">
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" step="0.01" value={recordForm.Weight}
                onChange={e => setRecordForm(p => ({ ...p, Weight: e.target.value }))} placeholder="e.g. 120.5" />
            </div>
            <div className="form-group">
              <label>Activity Level</label>
              <AdminSelect value={recordForm.ActivityLevel} onChange={v => setRecordForm(p => ({ ...p, ActivityLevel: v }))}
                options={['High', 'Normal', 'Low', 'Sedentary']} placeholder="Select level..." />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Weight Range Low (kg)</label>
              <input type="number" step="0.01" value={recordForm.WeightRangeLow}
                onChange={e => setRecordForm(p => ({ ...p, WeightRangeLow: e.target.value }))} placeholder="Min expected" />
            </div>
            <div className="form-group">
              <label>Weight Range High (kg)</label>
              <input type="number" step="0.01" value={recordForm.WeightRangeHigh}
                onChange={e => setRecordForm(p => ({ ...p, WeightRangeHigh: e.target.value }))} placeholder="Max expected" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Appetite Status</label>
              <AdminSelect value={recordForm.AppetiteStatus} onChange={v => setRecordForm(p => ({ ...p, AppetiteStatus: v }))}
                options={['Normal', 'Increased', 'Decreased', 'None']} placeholder="Select..." />
            </div>
            <div className="form-group">
              <label>Medical Conditions</label>
              <input value={recordForm.MedicalConditions}
                onChange={e => setRecordForm(p => ({ ...p, MedicalConditions: e.target.value }))} placeholder="e.g. Arthritis, skin rash" />
            </div>
          </div>
          <div className="form-group">
            <label>Recent Treatments</label>
            <input value={recordForm.RecentTreatments}
              onChange={e => setRecordForm(p => ({ ...p, RecentTreatments: e.target.value }))} placeholder="e.g. Antibiotics course, surgery" />
          </div>
        </div>
      </AdminModalForm>
    </div>
  );
};

export default AnimalHealth;
