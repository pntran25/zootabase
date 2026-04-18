import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../AdminTable.css';
import '../DataReports/DataReports.css';
import './AnimalReport.css';
import {
  ClipboardList, ChevronDown, ChevronRight, PawPrint, HeartPulse,
  UtensilsCrossed, Search, AlertTriangle, CheckCircle, Calendar, X,
  ChevronUp, ChevronsUpDown, LayoutDashboard, Table2, Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import AdminSelect from '../AdminSelect';
import AdminDatePicker from '../AdminDatePicker';
import { getAnimalReport, getAnimalsForDropdown, getHealthReport } from '../../../services/animalHealthService';
import { exportSectionsToSingleSheet } from '../../../utils/exportExcel';
import AnimalReportOverview from './AnimalReportOverview';

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

const healthPriority = { Critical: 0, Poor: 1, Fair: 2, Good: 3, Excellent: 4 };

const healthColor = {
  Excellent: '#10b981',
  Good: '#3b82f6',
  Fair: '#f59e0b',
  Critical: '#ef4444',
  Poor: '#ef4444',
};

const subTh = { padding: '6px 10px', textAlign: 'left', color: 'var(--adm-text-secondary)', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' };
const subTd = { padding: '5px 10px', color: 'var(--adm-text-primary)', whiteSpace: 'nowrap', fontSize: '0.76rem' };

/* ── Collapsible section (used inside expanded row) ── */
const Section = ({ icon, title, count, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ar-section">
      <div className="ar-section-header" onClick={() => setOpen(o => !o)}>
        {icon}
        <h3>{title}</h3>
        {count != null && <span className="ar-section-count">{count}</span>}
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </div>
      {open && <div className="ar-section-body">{children}</div>}
    </div>
  );
};

const AnimalReport = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [animals, setAnimals] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [reports, setReports] = useState({});
  const [loadingReports, setLoadingReports] = useState({});
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('custom');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [sortCol, setSortCol] = useState('health');
  const [sortDir, setSortDir] = useState('asc');
  // Extended filters
  const [filterHealth, setFilterHealth] = useState([]);
  const [filterGroups, setFilterGroups] = useState([]);
  const [filterExhibit, setFilterExhibit] = useState('');
  const [filterSex, setFilterSex] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');

  const getYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const TODAY = getYMD(new Date());

  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    const todayStr = getYMD(now);
    
    if (dateFilter === 'today') return { dateFrom: todayStr, dateTo: todayStr };
    if (dateFilter === 'week') {
      const s = new Date(now);
      s.setDate(s.getDate() - s.getDay());
      return { dateFrom: getYMD(s), dateTo: todayStr };
    }
    if (dateFilter === 'month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { dateFrom: getYMD(s), dateTo: todayStr };
    }
    if (dateFilter === 'custom') {
      return { dateFrom: customStart || '', dateTo: customEnd || '' };
    }
    return { dateFrom: '', dateTo: '' };
  }, [dateFilter, customStart, customEnd]);

  useEffect(() => {
    getAnimalsForDropdown()
      .then(data => setAnimals(data))
      .catch(() => { /* non-fatal */ });
  }, []);

  const loadReport = useCallback(async (id) => {
    if (reports[id] || loadingReports[id]) return;
    setLoadingReports(prev => ({ ...prev, [id]: true }));
    try {
      const data = await getAnimalReport(id);
      setReports(prev => ({ ...prev, [id]: data }));
    } catch (err) {
      toast.error(err.message || 'Failed to load animal report.');
    } finally {
      setLoadingReports(prev => ({ ...prev, [id]: false }));
    }
  }, [reports, loadingReports]);

  const toggleExpand = (animalId) => {
    const id = String(animalId);
    setExpandedRows(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id]) loadReport(id);
      return next;
    });
  };

  const inDateRange = (dateStr) => {
    if (!dateFrom && !dateTo) return true;
    if (!dateStr) return false;
    const d = (dateStr.includes('T') ? dateStr.split('T')[0] : dateStr);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  const allGroups = useMemo(() => [...new Set(animals.map(a => a.Species).filter(Boolean))].sort(), [animals]);
  const allExhibits = useMemo(() => [...new Set(animals.map(a => a.ExhibitName).filter(Boolean))].sort(), [animals]);

  const filteredAnimals = useMemo(() => {
    return [...animals]
      .filter(an => {
        if (search) {
          const q = search.toLowerCase();
          if (!((an.AnimalCode||'').toLowerCase().includes(q) || (an.Name||'').toLowerCase().includes(q) || (an.Species||'').toLowerCase().includes(q))) return false;
        }
        if (filterHealth.length > 0 && !filterHealth.includes(an.HealthStatus)) return false;
        if (filterGroups.length > 0 && !filterGroups.includes(an.Species)) return false;
        if (filterExhibit === '__unassigned__') { if (an.ExhibitName) return false; }
        else if (filterExhibit && an.ExhibitName !== filterExhibit) return false;
        if (filterSex && an.Gender !== filterSex) return false;
        if (ageMin !== '' && (an.Age == null || Number(an.Age) < Number(ageMin))) return false;
        if (ageMax !== '' && (an.Age == null || Number(an.Age) > Number(ageMax))) return false;
        if ((dateFrom || dateTo) && !inDateRange(an.DateArrived)) return false;
        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortCol === 'date') {
          const da = a.DateArrived ? new Date(a.DateArrived).getTime() : 0;
          const db = b.DateArrived ? new Date(b.DateArrived).getTime() : 0;
          return dir * (da - db);
        }
        // fallback to health priority if sortCol is 'health'
        return dir * ((healthPriority[a.HealthStatus] ?? 99) - (healthPriority[b.HealthStatus] ?? 99));
      });
  }, [animals, search, filterHealth, filterGroups, filterExhibit, filterSex, ageMin, ageMax, dateFrom, dateTo, sortCol, sortDir]);

  const activeAnimalFilterCount = [search, filterHealth.length > 0, filterGroups.length > 0, filterExhibit, filterSex, ageMin !== '', ageMax !== '', dateFrom, dateTo].filter(Boolean).length;
  const resetAnimalFilters = () => { setSearch(''); setFilterHealth([]); setFilterGroups([]); setFilterExhibit(''); setFilterSex(''); setAgeMin(''); setAgeMax(''); setDateFilter('custom'); setCustomStart(''); setCustomEnd(''); setSortCol('health'); setSortDir('asc'); };

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title"><ClipboardList size={26} className="title-icon" /> Animal Data Report</h1>
          <p className="admin-page-subtitle">Comprehensive report with all related data for each animal</p>
        </div>
        <button
          className="dr-details-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}
          disabled={animals.length === 0}
          onClick={async () => {
            try {
              toast.info('Preparing full animal report...');
              const healthData = await getHealthReport();
              const summaryRows = animals.map(a => ({
                'Animal ID': a.AnimalCode || '', 'Name': a.Name || '', 'Species': a.Species || '',
                'Exhibit': a.ExhibitName || '', 'Age': a.Age || '', 'Gender': a.Gender || '',
                'Health Status': a.HealthStatus || '',
              }));
              const recordRows = (healthData.records || []).filter(r => inDateRange(r.CheckupDate)).map(r => ({
                'Animal': r.AnimalName || '', 'Code': r.AnimalCode || '', 'Species': r.Species || '',
                'Checkup Date': r.CheckupDate ? new Date(r.CheckupDate).toLocaleDateString() : '',
                'Health Score': r.HealthScore ?? '', 'Staff': r.StaffName || '',
                'Weight': r.Weight ?? '', 'Activity Level': r.ActivityLevel || '',
                'Appetite': r.AppetiteStatus || '', 'Conditions': r.MedicalConditions || '',
                'Treatments': r.RecentTreatments || '', 'Notes': r.Notes || '',
              }));
              const feedingRows = (healthData.feedings || []).map(f => ({
                'Animal': f.AnimalName || '', 'Code': f.AnimalCode || '', 'Species': f.Species || '',
                'Food Type': f.FoodType || '', 'Quantity': f.Quantity ?? '',
                'Unit': f.Unit || '', 'Frequency': f.Frequency || '',
                'Time': f.FeedingTime || '', 'Instructions': f.SpecialInstructions || '',
              }));
              const alertRows = (healthData.alerts || []).filter(a => inDateRange(a.CreatedAt)).map(a => ({
                'Animal': a.AnimalName || '', 'Code': a.AnimalCode || '', 'Species': a.Species || '',
                'Alert Type': a.AlertType || '', 'Message': a.AlertMessage || '',
                'Date': a.CreatedAt ? new Date(a.CreatedAt).toLocaleDateString() : '',
                'Status': a.IsResolved ? 'Resolved' : 'Active',
              }));
              exportSectionsToSingleSheet([
                { name: 'Animals Summary', data: summaryRows },
                { name: 'Health Records', data: recordRows },
                { name: 'Feeding Schedules', data: feedingRows },
                { name: 'Health Alerts', data: alertRows },
              ], 'Animal_Report', { reportName: 'Animal Data Report', dateFrom, dateTo });
              toast.success('Animal report downloaded.');
            } catch (err) {
              toast.error('Failed to generate report.');
            }
          }}
        >
          <Download size={15} /> Download Excel
        </button>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="dr-tabs">
        <button className={`dr-tab${activeTab === 'overview' ? ' active' : ''}`} onClick={() => setActiveTab('overview')}>
          <LayoutDashboard size={14} /> Overview
        </button>
        <button className={`dr-tab${activeTab === 'animals' ? ' active' : ''}`} onClick={() => setActiveTab('animals')}>
          <PawPrint size={14} /> Animals Table
        </button>
      </div>

      {activeTab === 'overview' && <AnimalReportOverview />}


      {/* ── Filters Row 1: search + date (Animals tab only) ── */}
      <div style={{ display: activeTab === 'animals' ? 'flex' : 'none', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <div className="admin-search-container" style={{ maxWidth: 320, flex: 1, margin: 0 }}>
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by name, ID, or species..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {activeAnimalFilterCount > 0 && (
          <button
            onClick={resetAnimalFilters}
            style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <X size={12} /> Reset Filters
            <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: '0.68rem', marginLeft: 2 }}>{activeAnimalFilterCount}</span>
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {dateFilter === 'custom' && (
            <>
              <AdminDatePicker value={customStart} onChange={setCustomStart} placeholder="Start date" maxDate={customEnd || TODAY} />
              <span style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>to</span>
              <AdminDatePicker value={customEnd} onChange={setCustomEnd} placeholder="End date" minDate={customStart || undefined} maxDate={TODAY} />
            </>
          )}
          <AdminSelect
            value={dateFilter}
            onChange={v => { setDateFilter(v); setCustomStart(''); setCustomEnd(''); }}
            width="148px"
            options={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'custom', label: 'Custom Range' },
            ]}
          />
        </div>
      </div>

      {/* ── Filters Row 2: advanced filters (Animals tab only) ── */}
      <div style={{ display: activeTab === 'animals' ? 'flex' : 'none', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap', padding: '10px 14px', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 8 }}>
        {/* Health Status chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 2 }}>Health</span>
          {['Critical','Fair','Good','Excellent'].map(h => {
            const col = healthColor[h] || '#6b7280';
            const active = filterHealth.includes(h);
            return (
              <button key={h} onClick={() => setFilterHealth(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])}
                style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? col : 'var(--adm-border)'}`, background: active ? col + '22' : 'transparent', color: active ? col : 'var(--adm-text-secondary)', transition: 'all 0.15s' }}>
                {h}
              </button>
            );
          })}
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />

        {/* Animal Group multi-select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Group</span>
          <AdminSelect
            value={filterGroups[0] || ''}
            onChange={v => setFilterGroups(v ? [v] : [])}
            width="130px"
            options={[{ value: '', label: 'All Groups' }, ...allGroups.map(g => ({ value: g, label: g }))]}
          />
          {filterGroups.length > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--adm-accent)', fontWeight: 600 }}>{filterGroups[0]}</span>}
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />

        {/* Exhibit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exhibit</span>
          <AdminSelect
            value={filterExhibit}
            onChange={setFilterExhibit}
            width="150px"
            options={[
              { value: '', label: 'All Exhibits' },
              { value: '__unassigned__', label: 'Unassigned' },
              ...allExhibits.map(e => ({ value: e, label: e }))
            ]}
          />
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />

        {/* Sex toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sex</span>
          {['','Male','Female'].map(s => (
            <button key={s || 'all'} onClick={() => setFilterSex(s)}
              style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${filterSex === s ? 'var(--adm-accent)' : 'var(--adm-border)'}`, background: filterSex === s ? 'var(--adm-accent-dim)' : 'transparent', color: filterSex === s ? 'var(--adm-accent)' : 'var(--adm-text-secondary)', transition: 'all 0.15s' }}>
              {s || 'All'}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />

        {/* Age range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Age</span>
          <input type="number" min="0" placeholder="Min" value={ageMin} onChange={e => setAgeMin(e.target.value)}
            style={{ width: 52, padding: '4px 7px', borderRadius: 6, border: '1px solid var(--adm-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', fontSize: '0.78rem' }} />
          <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.75rem' }}>–</span>
          <input type="number" min="0" placeholder="Max" value={ageMax} onChange={e => setAgeMax(e.target.value)}
            style={{ width: 52, padding: '4px 7px', borderRadius: 6, border: '1px solid var(--adm-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', fontSize: '0.78rem' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--adm-text-muted)' }}>yrs</span>
        </div>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', margin: '0 0 10px 2px', display: activeTab === 'animals' ? undefined : 'none' }}>
        Click any row to expand and see the full animal report including health records, alerts, and feeding schedules.
      </p>

      {/* ── Animal table (Animals tab only) ── */}
      <div className="admin-table-container" style={{ display: activeTab === 'animals' ? undefined : 'none' }}>
        <div className="admin-table-scroll-inner" style={{ maxHeight: 700 }}>
          {animals.length === 0 ? (
            <div className="admin-table-empty">Loading animals...</div>
          ) : (
            <table className="admin-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ width: 36 }}></th>
                  <th>Animal ID</th>
                  <th onClick={() => toggleSort('date')} style={{ cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    DATE ARRIVED
                    {' '}
                    {sortCol === 'date'
                      ? (sortDir === 'asc' ? <ChevronUp size={12} className="sort-icon" /> : <ChevronDown size={12} className="sort-icon" />)
                      : <ChevronsUpDown size={12} className="sort-icon" />}
                  </th>
                  <th>Name</th>
                  <th>Animal Group</th>
                  <th>Exhibit</th>
                  <th>Age / Sex</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnimals.length === 0 ? (
                  <tr className="no-hover">
                    <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--adm-text-muted)' }}>
                      No animals found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredAnimals.map(an => {
                    const hc = healthColor[an.HealthStatus] || '#6b7280';
                    const id = String(an.AnimalID);
                    const isExpanded = !!expandedRows[id];
                    const report = reports[id];
                    const isLoading = !!loadingReports[id];
                    const a = report?.animal;

                    const filteredHealthRecords = (report?.healthRecords?.filter(r => inDateRange(r.CheckupDate)) || [])
                      .sort((a, b) => new Date(b.CheckupDate || 0) - new Date(a.CheckupDate || 0));
                    const filteredAlerts = (report?.alerts?.filter(al => inDateRange(al.CreatedAt)) || [])
                      .sort((a, b) => new Date(b.CreatedAt || 0) - new Date(a.CreatedAt || 0));

                    return [
                      <tr
                        key={an.AnimalID}
                        onClick={() => toggleExpand(an.AnimalID)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ textAlign: 'center', padding: '0 4px' }}>
                          <ChevronRight
                            size={14}
                            style={{
                              transition: 'transform 0.2s',
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              color: 'var(--adm-text-muted)',
                            }}
                          />
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', color: 'var(--adm-accent)', fontSize: '0.82rem' }}>
                            {an.AnimalCode || '—'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.85rem' }}>
                          {an.DateArrived ? new Date(an.DateArrived).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '—'}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {an.Name || <span style={{ color: 'var(--adm-text-muted)', fontStyle: 'italic' }}>Unnamed</span>}
                        </td>
                        <td>{an.Species}</td>
                        <td style={{ color: 'var(--adm-text-secondary)' }}>
                          {an.ExhibitName || <span style={{ color: 'var(--adm-text-muted)', fontStyle: 'italic' }}>Unassigned</span>}
                        </td>
                        <td style={{ color: 'var(--adm-text-secondary)' }}>
                          {an.Age ? `${an.Age} yrs` : '—'}{an.Gender ? ` · ${an.Gender}` : ''}
                        </td>
                        <td>
                          {an.HealthStatus && (
                            <span style={{
                              display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                              fontSize: '0.75rem', fontWeight: 600,
                              background: hc + '22', color: hc
                            }}>
                              {an.HealthStatus}
                            </span>
                          )}
                        </td>
                      </tr>,

                      /* ── Expanded detail panel ── */
                      isExpanded && (
                        <tr key={`${an.AnimalID}-detail`} className="no-hover">
                          <td colSpan={8} style={{ padding: 0, background: 'var(--adm-bg-surface)' }}>
                            <div style={{ padding: '14px 20px 18px 44px' }}>
                              {isLoading && (
                                <div className="admin-table-empty" style={{ padding: 24 }}>Loading report...</div>
                              )}

                              {!isLoading && !report && (
                                <div className="admin-table-empty" style={{ padding: 24 }}>No data found for this animal.</div>
                              )}

                              {!isLoading && report && a && (
                                <>
                                  {/* ── Animal Profile ── */}
                                  <Section icon={<PawPrint size={16} color="var(--adm-accent)" />} title="Animal Profile" defaultOpen={true}>
                                    <div className="ar-profile">
                                      <div className="ar-profile-item"><span className="ar-profile-label">Name</span><span className="ar-profile-value">{a.Name || '—'}</span></div>
                                      <div className="ar-profile-item"><span className="ar-profile-label">Animal Group</span><span className="ar-profile-value">{a.Species}</span></div>
                                      <div className="ar-profile-item"><span className="ar-profile-label">Age</span><span className="ar-profile-value">{a.Age} years</span></div>
                                      <div className="ar-profile-item"><span className="ar-profile-label">Gender</span><span className="ar-profile-value">{a.Gender || '—'}</span></div>
                                      <div className="ar-profile-item"><span className="ar-profile-label">Date Arrived</span><span className="ar-profile-value">{fmtDate(a.DateArrived)}</span></div>
                                      <div className="ar-profile-item"><span className="ar-profile-label">Habitat</span><span className="ar-profile-value">{a.HabitatType || '—'}</span></div>
                                      <div className="ar-profile-item"><span className="ar-profile-label">Exhibit</span><span className="ar-profile-value">{a.ExhibitName || '—'}</span></div>
                                      <div className="ar-profile-item"><span className="ar-profile-label">Area</span><span className="ar-profile-value">{a.AreaName || '—'}</span></div>
                                      {a.HealthStatus && <div className="ar-profile-item"><span className="ar-profile-label">Health Status</span><span className="ar-profile-value">{a.HealthStatus}</span></div>}
                                      {a.Diet && <div className="ar-profile-item"><span className="ar-profile-label">Diet</span><span className="ar-profile-value">{a.Diet}</span></div>}
                                      {a.Weight && <div className="ar-profile-item"><span className="ar-profile-label">Weight</span><span className="ar-profile-value">{a.Weight}</span></div>}
                                      {a.Region && <div className="ar-profile-item"><span className="ar-profile-label">Region</span><span className="ar-profile-value">{a.Region}</span></div>}
                                      {a.Lifespan && <div className="ar-profile-item"><span className="ar-profile-label">Lifespan</span><span className="ar-profile-value">{a.Lifespan}</span></div>}
                                      {a.FunFact && <div className="ar-profile-item"><span className="ar-profile-label">Fun Fact</span><span className="ar-profile-value">{a.FunFact}</span></div>}
                                      {a.IsEndangered != null && <div className="ar-profile-item"><span className="ar-profile-label">Endangered</span><span className="ar-profile-value">{a.IsEndangered ? 'Yes' : 'No'}</span></div>}
                                    </div>
                                  </Section>

                                  {/* ── Health Records + Feeding Schedules (side by side) ── */}
                                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 8 }}>

                                    {/* Health Records (left) */}
                                    <div style={{ flex: '1 1 480px', minWidth: 360 }}>
                                      <h4 style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--adm-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <HeartPulse size={14} color="#ef4444" /> Health Records
                                        <span style={{ fontWeight: 400, color: 'var(--adm-text-muted)', fontSize: '0.75rem', marginLeft: 4 }}>
                                          ({filteredHealthRecords.length} record{filteredHealthRecords.length !== 1 ? 's' : ''})
                                        </span>
                                      </h4>
                                      {filteredHealthRecords.length === 0 ? (
                                        <p style={{ color: 'var(--adm-text-muted)', fontSize: '0.78rem', margin: 0 }}>No health records {dateFrom || dateTo ? 'in the selected date range.' : 'on file.'}</p>
                                      ) : (
                                        <div style={{ border: '1px solid var(--adm-border)', borderRadius: 6, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
                                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                                            <thead>
                                              <tr style={{ background: 'var(--adm-bg-surface-2)' }}>
                                                <th style={subTh}>Date</th><th style={subTh}>Score</th><th style={subTh}>Weight</th>
                                                <th style={subTh}>Activity</th><th style={subTh}>Staff</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {filteredHealthRecords.map(r => (
                                                <tr key={r.RecordID} style={{ borderTop: '1px solid var(--adm-border)' }}>
                                                  <td style={subTd}>{fmtDate(r.CheckupDate)}</td>
                                                  <td style={subTd}><span className={`ah-score ${scoreClass(r.HealthScore)}`}><span className="ah-score-dot" />{r.HealthScore} — {scoreLabel(r.HealthScore)}</span></td>
                                                  <td style={subTd}>{r.Weight != null ? `${Number(r.Weight).toFixed(1)} kg` : '—'}</td>
                                                  <td style={subTd}>{r.ActivityLevel || '—'}</td>
                                                  <td style={subTd}>{r.StaffName || '—'}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>

                                    {/* Feeding Schedules (right) */}
                                    <div style={{ flex: '1 1 320px', minWidth: 280 }}>
                                      <h4 style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--adm-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <UtensilsCrossed size={14} color="#f59e0b" /> Feeding Schedules
                                        <span style={{ fontWeight: 400, color: 'var(--adm-text-muted)', fontSize: '0.75rem', marginLeft: 4 }}>
                                          ({report.feedings.length} schedule{report.feedings.length !== 1 ? 's' : ''})
                                        </span>
                                      </h4>
                                      {report.feedings.length === 0 ? (
                                        <p style={{ color: 'var(--adm-text-muted)', fontSize: '0.78rem', margin: 0 }}>No feeding schedules found.</p>
                                      ) : (
                                        <div style={{ border: '1px solid var(--adm-border)', borderRadius: 6, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
                                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                                            <thead>
                                              <tr style={{ background: 'var(--adm-bg-surface-2)' }}>
                                                <th style={subTh}>Feed Time</th><th style={subTh}>Food Type</th><th style={subTh}>Staff</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {report.feedings.map(f => (
                                                <tr key={f.ScheduleID} style={{ borderTop: '1px solid var(--adm-border)' }}>
                                                  <td style={subTd}>{f.FeedTime ? new Date(f.FeedTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                                  <td style={subTd}>{f.FoodType || '—'}</td>
                                                  <td style={subTd}>{f.StaffName || '—'}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* ── Health Alerts (full width, below) ── */}
                                  <div style={{ marginTop: 12 }}>
                                    <h4 style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--adm-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <AlertTriangle size={14} color="#f59e0b" /> Health Alerts
                                      <span style={{ fontWeight: 400, color: 'var(--adm-text-muted)', fontSize: '0.75rem', marginLeft: 4 }}>
                                        ({filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''})
                                      </span>
                                    </h4>
                                    {filteredAlerts.length === 0 ? (
                                      <p style={{ color: 'var(--adm-text-muted)', fontSize: '0.78rem', margin: 0 }}>No health alerts {dateFrom || dateTo ? 'in the selected date range.' : '.'}</p>
                                    ) : (
                                      <div style={{ border: '1px solid var(--adm-border)', borderRadius: 6, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                                          <thead>
                                            <tr style={{ background: 'var(--adm-bg-surface-2)' }}>
                                              <th style={subTh}>Date</th><th style={subTh}>Type</th><th style={subTh}>Message</th><th style={subTh}>Status</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {filteredAlerts.map(al => (
                                              <tr key={al.AlertID} style={{ borderTop: '1px solid var(--adm-border)' }}>
                                                <td style={subTd}>{fmtDate(al.CreatedAt)}</td>
                                                <td style={subTd}>{al.AlertType}</td>
                                                <td style={{ ...subTd, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{al.AlertMessage}</td>
                                                <td style={subTd}>{al.IsResolved
                                                  ? <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}><CheckCircle size={13} style={{ verticalAlign: 'middle' }} /> Resolved</span>
                                                  : <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8rem' }}><AlertTriangle size={13} style={{ verticalAlign: 'middle' }} /> Active</span>
                                                }</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ),
                    ];
                  }).flat().filter(Boolean)
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimalReport;
