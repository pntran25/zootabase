import React, { useState, useEffect, useMemo } from 'react';
import '../AdminTable.css';
import '../DataReports/DataReports.css';
import './AnimalReport.css';
import {
  ClipboardList, ChevronDown, ChevronRight, ChevronLeft, PawPrint, HeartPulse,
  UtensilsCrossed, Search, AlertTriangle, CheckCircle, Calendar, X,
  ChevronUp, ChevronsUpDown, LayoutDashboard, Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import AdminSelect from '../AdminSelect';
import AdminDatePicker from '../AdminDatePicker';
import { getAnimalsForDropdown, getHealthReport } from '../../../services/animalHealthService';
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
const PAGE_SIZE = 15;

const healthColor = {
  Excellent: '#10b981',
  Good: '#3b82f6',
  Fair: '#f59e0b',
  Critical: '#ef4444',
  Poor: '#ef4444',
};



const AnimalReport = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [animals, setAnimals] = useState([]);
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
  const [animalPage, setAnimalPage] = useState(0);
  // Health data for flat tables
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [recordsPage, setRecordsPage] = useState(0);
  const [feedingsPage, setFeedingsPage] = useState(0);
  const [alertsPage, setAlertsPage] = useState(0);
  const [recordsSortCol, setRecordsSortCol] = useState('date');
  const [recordsSortDir, setRecordsSortDir] = useState('desc');
  const [alertsSortCol, setAlertsSortCol] = useState('date');
  const [alertsSortDir, setAlertsSortDir] = useState('desc');
  // Health Records tab filters
  const [filterActivity, setFilterActivity] = useState('');
  const [filterRecordStaff, setFilterRecordStaff] = useState('');
  // Feeding Schedules tab filters
  const [filterFoodType, setFilterFoodType] = useState('');
  const [filterFrequency, setFilterFrequency] = useState('');
  // Health Alerts tab filters
  const [filterAlertType, setFilterAlertType] = useState('');
  const [filterAlertResolved, setFilterAlertResolved] = useState('');

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

  // Lazy load health data when switching to health/feeding/alert tabs
  useEffect(() => {
    if (!['records', 'feedings', 'alerts'].includes(activeTab)) return;
    if (healthData || healthLoading) return;
    setHealthLoading(true);
    getHealthReport()
      .then(data => setHealthData(data))
      .catch(() => toast.error('Failed to load health data.'))
      .finally(() => setHealthLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
  const allActivityLevels = useMemo(() => {
    if (!healthData?.records) return [];
    return [...new Set(healthData.records.map(r => r.ActivityLevel).filter(Boolean))].sort();
  }, [healthData]);
  const allRecordStaff = useMemo(() => {
    if (!healthData?.records) return [];
    return [...new Set(healthData.records.map(r => r.StaffName).filter(Boolean))].sort();
  }, [healthData]);
  const allFoodTypes = useMemo(() => {
    if (!healthData?.feedings) return [];
    return [...new Set(healthData.feedings.map(f => f.FoodType).filter(Boolean))].sort();
  }, [healthData]);
  const allFrequencies = useMemo(() => {
    if (!healthData?.feedings) return [];
    return [...new Set(healthData.feedings.map(f => f.Frequency).filter(Boolean))].sort();
  }, [healthData]);
  const allAlertTypes = useMemo(() => {
    if (!healthData?.alerts) return [];
    return [...new Set(healthData.alerts.map(a => a.AlertType).filter(Boolean))].sort();
  }, [healthData]);

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
        if (sortCol === 'name') {
          return dir * (a.Name || '').localeCompare(b.Name || '');
        }
        if (sortCol === 'group') {
          return dir * (a.Species || '').localeCompare(b.Species || '');
        }
        if (sortCol === 'exhibit') {
          return dir * (a.ExhibitName || '').localeCompare(b.ExhibitName || '');
        }
        if (sortCol === 'age') {
          return dir * ((a.Age ?? -1) - (b.Age ?? -1));
        }
        // health: Critical(0) → Fair(1) → Good(2) → Excellent(3)
        return dir * ((healthPriority[a.HealthStatus] ?? 99) - (healthPriority[b.HealthStatus] ?? 99));
      });
  }, [animals, search, filterHealth, filterGroups, filterExhibit, filterSex, ageMin, ageMax, dateFrom, dateTo, sortCol, sortDir]);

  const activeAnimalFilterCount = [search, filterHealth.length > 0, filterGroups.length > 0, filterExhibit, filterSex, ageMin !== '', ageMax !== '', dateFrom, dateTo, !!filterActivity, !!filterRecordStaff, !!filterFoodType, !!filterFrequency, !!filterAlertType, !!filterAlertResolved].filter(Boolean).length;
  const resetAnimalFilters = () => { setSearch(''); setFilterHealth([]); setFilterGroups([]); setFilterExhibit(''); setFilterSex(''); setAgeMin(''); setAgeMax(''); setDateFilter('custom'); setCustomStart(''); setCustomEnd(''); setSortCol('health'); setSortDir('asc'); setFilterActivity(''); setFilterRecordStaff(''); setFilterFoodType(''); setFilterFrequency(''); setFilterAlertType(''); setFilterAlertResolved(''); };

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  // Filtered health records for Health Records tab
  const filteredRecords = useMemo(() => {
    if (!healthData?.records) return [];
    return healthData.records
      .filter(r => {
        if (!inDateRange(r.CheckupDate)) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!((r.AnimalName || '').toLowerCase().includes(q) || (r.AnimalCode || '').toLowerCase().includes(q) || (r.Species || '').toLowerCase().includes(q))) return false;
        }
        if (filterHealth.length > 0) {
          const label = scoreLabel(r.HealthScore);
          if (!filterHealth.includes(label)) return false;
        }
        if (filterGroups.length > 0 && !filterGroups.includes(r.Species)) return false;
        if (filterActivity && r.ActivityLevel !== filterActivity) return false;
        if (filterRecordStaff && r.StaffName !== filterRecordStaff) return false;
        return true;
      })
      .sort((a, b) => {
        const dir = recordsSortDir === 'asc' ? 1 : -1;
        if (recordsSortCol === 'date') return dir * ((a.CheckupDate || '').localeCompare(b.CheckupDate || ''));
        if (recordsSortCol === 'animal') return dir * ((a.AnimalName || '').localeCompare(b.AnimalName || ''));
        if (recordsSortCol === 'score') return dir * ((a.HealthScore ?? 0) - (b.HealthScore ?? 0));
        if (recordsSortCol === 'staff') return dir * ((a.StaffName || '').localeCompare(b.StaffName || ''));
        return 0;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthData, search, filterHealth, filterGroups, filterActivity, filterRecordStaff, dateFrom, dateTo, recordsSortCol, recordsSortDir]);

  // Filtered feedings for Feeding Schedules tab
  const filteredFeedings = useMemo(() => {
    if (!healthData?.feedings) return [];
    return healthData.feedings.filter(f => {
      if (search) {
        const q = search.toLowerCase();
        if (!((f.AnimalName || '').toLowerCase().includes(q) || (f.AnimalCode || '').toLowerCase().includes(q) || (f.Species || '').toLowerCase().includes(q))) return false;
      }
      if (filterGroups.length > 0 && !filterGroups.includes(f.Species)) return false;
      if (filterFoodType && f.FoodType !== filterFoodType) return false;
      if (filterFrequency && f.Frequency !== filterFrequency) return false;
      return true;
    });
  }, [healthData, search, filterGroups, filterFoodType, filterFrequency]);

  // Filtered alerts for Health Alerts tab
  const filteredAlerts = useMemo(() => {
    if (!healthData?.alerts) return [];
    return healthData.alerts
      .filter(a => {
        if (!inDateRange(a.CreatedAt)) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!((a.AnimalName || '').toLowerCase().includes(q) || (a.AnimalCode || '').toLowerCase().includes(q) || (a.Species || '').toLowerCase().includes(q))) return false;
        }
        if (filterGroups.length > 0 && !filterGroups.includes(a.Species)) return false;
        if (filterAlertType && a.AlertType !== filterAlertType) return false;
        if (filterAlertResolved === 'active' && a.IsResolved) return false;
        if (filterAlertResolved === 'resolved' && !a.IsResolved) return false;
        return true;
      })
      .sort((a, b) => {
        const dir = alertsSortDir === 'asc' ? 1 : -1;
        if (alertsSortCol === 'date') return dir * ((a.CreatedAt || '').localeCompare(b.CreatedAt || ''));
        if (alertsSortCol === 'animal') return dir * ((a.AnimalName || '').localeCompare(b.AnimalName || ''));
        if (alertsSortCol === 'type') return dir * ((a.AlertType || '').localeCompare(b.AlertType || ''));
        return 0;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthData, search, filterGroups, filterAlertType, filterAlertResolved, dateFrom, dateTo, alertsSortCol, alertsSortDir]);

  const toggleRecordsSort = (col) => {
    if (recordsSortCol === col) setRecordsSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setRecordsSortCol(col); setRecordsSortDir('asc'); }
  };
  const toggleAlertsSort = (col) => {
    if (alertsSortCol === col) setAlertsSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setAlertsSortCol(col); setAlertsSortDir('asc'); }
  };

  const RecordsSortHeader = ({ col, children }) => (
    <th onClick={() => toggleRecordsSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      {children}{' '}
      {recordsSortCol === col
        ? (recordsSortDir === 'asc' ? <ChevronUp size={12} className="sort-icon" /> : <ChevronDown size={12} className="sort-icon" />)
        : <ChevronsUpDown size={12} className="sort-icon" />}
    </th>
  );

  const AlertsSortHeader = ({ col, children }) => (
    <th onClick={() => toggleAlertsSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      {children}{' '}
      {alertsSortCol === col
        ? (alertsSortDir === 'asc' ? <ChevronUp size={12} className="sort-icon" /> : <ChevronDown size={12} className="sort-icon" />)
        : <ChevronsUpDown size={12} className="sort-icon" />}
    </th>
  );

  const renderPagination = (totalCount, currentPage, setPage, label) => {
    const pageCount = Math.ceil(totalCount / PAGE_SIZE);
    if (totalCount === 0 || pageCount <= 1) return null;
    let pages = [];
    if (pageCount <= 6) {
      pages = Array.from({ length: pageCount }, (_, i) => i);
    } else {
      if (currentPage <= 2) pages = [0, 1, 2, 3, 4, '...', pageCount - 1];
      else if (currentPage >= pageCount - 3) pages = [0, '...', pageCount - 5, pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1];
      else pages = [0, '...', currentPage - 1, currentPage, currentPage + 1, '...', pageCount - 1];
    }
    return (
      <div className="admin-table-pagination" style={{ borderTop: '1px solid var(--adm-border)' }}>
        <span className="admin-pagination-info">Page {currentPage + 1} of {pageCount} · {totalCount} {label}</span>
        <div className="admin-pagination-controls">
          <button className="admin-pagination-btn" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0}><ChevronLeft size={14} /></button>
          {pages.map((p, idx) => p === '...' ? (
            <span key={`e-${idx}`} style={{ padding: '0 8px', color: 'var(--adm-text-secondary)' }}>...</span>
          ) : (
            <button key={p} className={`admin-pagination-btn${currentPage === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p + 1}</button>
          ))}
          <button className="admin-pagination-btn" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount - 1}><ChevronRight size={14} /></button>
        </div>
      </div>
    );
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
              const now = new Date();
              const stamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
              exportSectionsToSingleSheet([
                { name: 'Animals Summary', data: summaryRows },
                { name: 'Health Records', data: recordRows },
                { name: 'Feeding Schedules', data: feedingRows },
                { name: 'Health Alerts', data: alertRows },
              ], `Animal Data Report Snapshot ${stamp}`, { reportName: 'Animal Data Report', dateFrom, dateTo });
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
          <PawPrint size={14} /> Animals
        </button>
        <button className={`dr-tab${activeTab === 'records' ? ' active' : ''}`} onClick={() => setActiveTab('records')}>
          <HeartPulse size={14} /> Health Records
        </button>
        <button className={`dr-tab${activeTab === 'feedings' ? ' active' : ''}`} onClick={() => setActiveTab('feedings')}>
          <UtensilsCrossed size={14} /> Feeding Schedules
        </button>
        <button className={`dr-tab${activeTab === 'alerts' ? ' active' : ''}`} onClick={() => setActiveTab('alerts')}>
          <Bell size={14} /> Health Alerts
        </button>
      </div>

      {activeTab === 'overview' && <AnimalReportOverview />}


      {/* ── Filters Row 1: search + date ── */}
      <div style={{ display: activeTab === 'overview' ? 'none' : 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
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
        {/* Date range — relevant for animals (dateArrived), records (checkupDate), alerts (createdAt), not feedings */}
        {activeTab !== 'feedings' && (
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
        )}
      </div>

      {/* ── Filters Row 2: advanced filters (tab-specific) ── */}
      {activeTab !== 'overview' && (activeTab === 'animals' || activeTab === 'records') && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap', padding: '10px 14px', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 8 }}>
        {/* Health Status chips — Animals + Health Records */}
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

        {activeTab === 'animals' && (<>
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
        </>)}

        {/* Activity + Staff — Health Records only */}
        {activeTab === 'records' && (<>
        <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activity</span>
          <AdminSelect
            value={filterActivity}
            onChange={setFilterActivity}
            width="130px"
            options={[{ value: '', label: 'All Levels' }, ...allActivityLevels.map(a => ({ value: a, label: a }))]}
          />
        </div>
        <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff</span>
          <AdminSelect
            value={filterRecordStaff}
            onChange={setFilterRecordStaff}
            width="160px"
            searchable
            options={[{ value: '', label: 'All Staff' }, ...allRecordStaff.map(s => ({ value: s, label: s }))]}
          />
        </div>
        </>)}
      </div>
      )}

      {/* ── Filters Row 2b: Group + tab-specific for feedings/alerts ── */}
      {(activeTab === 'feedings' || activeTab === 'alerts') && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap', padding: '10px 14px', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 8 }}>
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

        {/* Food Type + Frequency — Feeding Schedules only */}
        {activeTab === 'feedings' && (<>
        <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Food Type</span>
          <AdminSelect
            value={filterFoodType}
            onChange={setFilterFoodType}
            width="140px"
            options={[{ value: '', label: 'All Types' }, ...allFoodTypes.map(t => ({ value: t, label: t }))]}
          />
        </div>
        <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Frequency</span>
          <AdminSelect
            value={filterFrequency}
            onChange={setFilterFrequency}
            width="130px"
            options={[{ value: '', label: 'All' }, ...allFrequencies.map(f => ({ value: f, label: f }))]}
          />
        </div>
        </>)}

        {/* Alert Type + Resolved Status — Health Alerts only */}
        {activeTab === 'alerts' && (<>
        <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alert Type</span>
          <AdminSelect
            value={filterAlertType}
            onChange={setFilterAlertType}
            width="150px"
            options={[{ value: '', label: 'All Types' }, ...allAlertTypes.map(t => ({ value: t, label: t }))]}
          />
        </div>
        <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
          {[['','All'],['active','Active'],['resolved','Resolved']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilterAlertResolved(val)}
              style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${filterAlertResolved === val ? (val === 'active' ? '#ef4444' : val === 'resolved' ? '#10b981' : 'var(--adm-accent)') : 'var(--adm-border)'}`, background: filterAlertResolved === val ? (val === 'active' ? 'rgba(239,68,68,0.12)' : val === 'resolved' ? 'rgba(16,185,129,0.15)' : 'var(--adm-accent-dim)') : 'transparent', color: filterAlertResolved === val ? (val === 'active' ? '#ef4444' : val === 'resolved' ? '#10b981' : 'var(--adm-accent)') : 'var(--adm-text-secondary)', transition: 'all 0.15s' }}>
              {lbl}
            </button>
          ))}
        </div>
        </>)}
      </div>
      )}

      {/* ── Summary bars ── */}
      {activeTab === 'animals' && (
        <div style={{ display: 'flex', gap: 20, marginBottom: 14, padding: '10px 16px', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--adm-text-secondary)', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>Showing <strong style={{ margin: '0 3px' }}>{filteredAnimals.length}</strong> of {animals.length} animals</span>
        </div>
      )}
      {activeTab === 'records' && (
        <div style={{ display: 'flex', gap: 20, marginBottom: 14, padding: '10px 16px', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--adm-text-secondary)', alignItems: 'center', flexWrap: 'wrap' }}>
          {healthLoading ? <span>Loading health records...</span> : <span>Showing <strong style={{ margin: '0 3px' }}>{filteredRecords.length}</strong> health records</span>}
        </div>
      )}
      {activeTab === 'feedings' && (
        <div style={{ display: 'flex', gap: 20, marginBottom: 14, padding: '10px 16px', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--adm-text-secondary)', alignItems: 'center', flexWrap: 'wrap' }}>
          {healthLoading ? <span>Loading feeding schedules...</span> : <span>Showing <strong style={{ margin: '0 3px' }}>{filteredFeedings.length}</strong> feeding schedules</span>}
        </div>
      )}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', gap: 20, marginBottom: 14, padding: '10px 16px', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--adm-text-secondary)', alignItems: 'center', flexWrap: 'wrap' }}>
          {healthLoading ? <span>Loading health alerts...</span> : <span>Showing <strong style={{ margin: '0 3px' }}>{filteredAlerts.length}</strong> health alerts</span>}
        </div>
      )}

      {/* ── Animals Table ── */}
      {activeTab === 'animals' && (
      <>
      <div className="admin-table-container">
          {animals.length === 0 ? (
            <div className="admin-table-empty">Loading animals...</div>
          ) : (
            <table className="admin-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>Animal ID</th>
                  <th onClick={() => toggleSort('date')} style={{ cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    DATE ARRIVED{' '}
                    {sortCol === 'date'
                      ? (sortDir === 'asc' ? <ChevronUp size={12} className="sort-icon" /> : <ChevronDown size={12} className="sort-icon" />)
                      : <ChevronsUpDown size={12} className="sort-icon" />}
                  </th>
                  <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    NAME{' '}
                    {sortCol === 'name'
                      ? (sortDir === 'asc' ? <ChevronUp size={12} className="sort-icon" /> : <ChevronDown size={12} className="sort-icon" />)
                      : <ChevronsUpDown size={12} className="sort-icon" />}
                  </th>
                  <th onClick={() => toggleSort('group')} style={{ cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    ANIMAL GROUP{' '}
                    {sortCol === 'group'
                      ? (sortDir === 'asc' ? <ChevronUp size={12} className="sort-icon" /> : <ChevronDown size={12} className="sort-icon" />)
                      : <ChevronsUpDown size={12} className="sort-icon" />}
                  </th>
                  <th onClick={() => toggleSort('exhibit')} style={{ cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    EXHIBIT{' '}
                    {sortCol === 'exhibit'
                      ? (sortDir === 'asc' ? <ChevronUp size={12} className="sort-icon" /> : <ChevronDown size={12} className="sort-icon" />)
                      : <ChevronsUpDown size={12} className="sort-icon" />}
                  </th>
                  <th onClick={() => toggleSort('age')} style={{ cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    AGE / SEX{' '}
                    {sortCol === 'age'
                      ? (sortDir === 'asc' ? <ChevronUp size={12} className="sort-icon" /> : <ChevronDown size={12} className="sort-icon" />)
                      : <ChevronsUpDown size={12} className="sort-icon" />}
                  </th>
                  <th onClick={() => toggleSort('health')} style={{ cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    HEALTH{' '}
                    {sortCol === 'health'
                      ? (sortDir === 'asc' ? <ChevronUp size={12} className="sort-icon" /> : <ChevronDown size={12} className="sort-icon" />)
                      : <ChevronsUpDown size={12} className="sort-icon" />}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAnimals.length === 0 ? (
                  <tr className="no-hover">
                    <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--adm-text-muted)' }}>
                      No animals found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredAnimals.slice(animalPage * PAGE_SIZE, (animalPage + 1) * PAGE_SIZE).map(an => {
                    const hc = healthColor[an.HealthStatus] || '#6b7280';
                    return (
                      <tr key={an.AnimalID}>
                        <td><span style={{ fontFamily: 'monospace', color: 'var(--adm-accent)', fontSize: '0.82rem' }}>{an.AnimalCode || '—'}</span></td>
                        <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.85rem' }}>{an.DateArrived ? new Date(an.DateArrived).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '—'}</td>
                        <td style={{ fontWeight: 600 }}>{an.Name || <span style={{ color: 'var(--adm-text-muted)', fontStyle: 'italic' }}>Unnamed</span>}</td>
                        <td>{an.Species}</td>
                        <td style={{ color: 'var(--adm-text-secondary)' }}>{an.ExhibitName || <span style={{ color: 'var(--adm-text-muted)', fontStyle: 'italic' }}>Unassigned</span>}</td>
                        <td style={{ color: 'var(--adm-text-secondary)' }}>{an.Age ? `${an.Age} yrs` : '—'}{an.Gender ? ` · ${an.Gender}` : ''}</td>
                        <td>{an.HealthStatus && (<span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: hc + '22', color: hc }}>{an.HealthStatus}</span>)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
      </div>
      {renderPagination(filteredAnimals.length, animalPage, setAnimalPage, 'animals')}
      </>
      )}

      {/* ── Health Records Table ── */}
      {activeTab === 'records' && (
      <>
      {healthLoading ? (
        <div className="admin-table-empty" style={{ padding: 32 }}>Loading health records...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <RecordsSortHeader col="animal">Animal</RecordsSortHeader>
                <th>Code</th>
                <th>Species</th>
                <RecordsSortHeader col="date">Date</RecordsSortHeader>
                <RecordsSortHeader col="score">Score</RecordsSortHeader>
                <th>Weight</th>
                <th>Activity</th>
                <RecordsSortHeader col="staff">Staff</RecordsSortHeader>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr className="no-hover"><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--adm-text-muted)' }}>No health records found.</td></tr>
              ) : (
                filteredRecords.slice(recordsPage * PAGE_SIZE, (recordsPage + 1) * PAGE_SIZE).map((r, i) => (
                  <tr key={r.RecordID || i}>
                    <td style={{ fontWeight: 600 }}>{r.AnimalName || '—'}</td>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--adm-accent)', fontSize: '0.82rem' }}>{r.AnimalCode || '—'}</span></td>
                    <td>{r.Species || '—'}</td>
                    <td>{fmtDate(r.CheckupDate)}</td>
                    <td><span className={`ah-score ${scoreClass(r.HealthScore)}`}><span className="ah-score-dot" />{r.HealthScore} — {scoreLabel(r.HealthScore)}</span></td>
                    <td>{r.Weight != null ? `${Number(r.Weight).toFixed(1)} kg` : '—'}</td>
                    <td>{r.ActivityLevel || '—'}</td>
                    <td>{r.StaffName || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {renderPagination(filteredRecords.length, recordsPage, setRecordsPage, 'health records')}
      </>
      )}

      {/* ── Feeding Schedules Table ── */}
      {activeTab === 'feedings' && (
      <>
      {healthLoading ? (
        <div className="admin-table-empty" style={{ padding: 32 }}>Loading feeding schedules...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th>Animal</th><th>Code</th><th>Species</th>
                <th>Food Type</th><th>Quantity</th><th>Frequency</th>
                <th>Time</th><th>Special Instructions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedings.length === 0 ? (
                <tr className="no-hover"><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--adm-text-muted)' }}>No feeding schedules found.</td></tr>
              ) : (
                filteredFeedings.slice(feedingsPage * PAGE_SIZE, (feedingsPage + 1) * PAGE_SIZE).map((f, i) => (
                  <tr key={f.ScheduleID || i}>
                    <td style={{ fontWeight: 600 }}>{f.AnimalName || '—'}</td>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--adm-accent)', fontSize: '0.82rem' }}>{f.AnimalCode || '—'}</span></td>
                    <td>{f.Species || '—'}</td>
                    <td>{f.FoodType || '—'}</td>
                    <td>{f.Quantity != null ? `${f.Quantity} ${f.Unit || ''}`.trim() : '—'}</td>
                    <td>{f.Frequency || '—'}</td>
                    <td>{f.FeedingTime || '—'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.SpecialInstructions || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {renderPagination(filteredFeedings.length, feedingsPage, setFeedingsPage, 'feeding schedules')}
      </>
      )}

      {/* ── Health Alerts Table ── */}
      {activeTab === 'alerts' && (
      <>
      {healthLoading ? (
        <div className="admin-table-empty" style={{ padding: 32 }}>Loading health alerts...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <AlertsSortHeader col="animal">Animal</AlertsSortHeader>
                <th>Code</th>
                <th>Species</th>
                <AlertsSortHeader col="type">Alert Type</AlertsSortHeader>
                <th>Message</th>
                <AlertsSortHeader col="date">Date</AlertsSortHeader>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr className="no-hover"><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--adm-text-muted)' }}>No health alerts found.</td></tr>
              ) : (
                filteredAlerts.slice(alertsPage * PAGE_SIZE, (alertsPage + 1) * PAGE_SIZE).map((a, i) => (
                  <tr key={a.AlertID || i}>
                    <td style={{ fontWeight: 600 }}>{a.AnimalName || '—'}</td>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--adm-accent)', fontSize: '0.82rem' }}>{a.AnimalCode || '—'}</span></td>
                    <td>{a.Species || '—'}</td>
                    <td>{a.AlertType || '—'}</td>
                    <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.AlertMessage || '—'}</td>
                    <td>{fmtDate(a.CreatedAt)}</td>
                    <td>{a.IsResolved
                      ? <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}><CheckCircle size={13} style={{ verticalAlign: 'middle' }} /> Resolved</span>
                      : <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8rem' }}><AlertTriangle size={13} style={{ verticalAlign: 'middle' }} /> Active</span>
                    }</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {renderPagination(filteredAlerts.length, alertsPage, setAlertsPage, 'health alerts')}
      </>
      )}
    </div>
  );
};

export default AnimalReport;
