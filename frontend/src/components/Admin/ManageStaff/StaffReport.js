import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Clock, PawPrint, ChevronUp, ChevronDown, ChevronsUpDown, Users, ChevronRight, ChevronLeft, Calendar, MapPin, Download, X, LayoutDashboard, Table2 } from 'lucide-react';
import StaffReportOverview from './StaffReportOverview';

import AdminSelect from '../AdminSelect';
import AdminDatePicker from '../AdminDatePicker';
import { API_BASE_URL } from '../../../services/apiClient';
import '../AdminTable.css';
import '../DataReports/DataReports.css';
import { exportSectionsToSingleSheet } from '../../../utils/exportExcel';

const ROLES = ['Super Admin', 'Zoo Manager', 'Caretaker', 'Event Coordinator', 'Ticket Staff', 'Shop Manager', 'Maintenance'];
const PAGE_SIZE = 15;

const roleColors = {
  'Super Admin': { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  'Zoo Manager': { bg: 'rgba(8,145,178,0.15)', color: '#0891b2' },
  'Caretaker': { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  'Event Coordinator': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  'Ticket Staff': { bg: 'rgba(234,179,8,0.15)', color: '#ca8a04' },
  'Shop Manager': { bg: 'rgba(249,115,22,0.15)', color: '#ea580c' },
  'Maintenance': { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
};

function parseTime(t) {
  if (!t) return null;
  let timeStr = t;
  if (t.includes('T')) {
    timeStr = t.split('T')[1]?.substring(0, 5) || t;
  }
  const [h, m] = timeStr.substring(0, 5).split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h + m / 60;
}

function formatTime(t) {
  if (!t) return '—';
  let timeStr = t;
  if (t.includes('T')) timeStr = t.split('T')[1]?.substring(0, 5) || t;
  const [h, m] = timeStr.substring(0, 5).split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '—';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(d) {
  if (!d) return '—';
  const dateStr = d.includes('T') ? d.split('T')[0] : d;
  const [y, mo, da] = dateStr.split('-');
  if (!y || !mo || !da) return dateStr;
  return `${mo}/${da}/${y}`;
}

function shiftDuration(start, end) {
  const s = parseTime(start);
  const e = parseTime(end);
  if (s === null || e === null || e <= s) return 0;
  return Math.round((e - s) * 100) / 100;
}

const StaffReport = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [staffList, setStaffList] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRoles, setFilterRoles] = useState([]); // multi-select
  const [filterStaff, setFilterStaff] = useState('');
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [dateFilter, setDateFilter] = useState('custom');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  // Extended filters
  const [shiftMin, setShiftMin] = useState('');
  const [shiftMax, setShiftMax] = useState('');
  const [hoursMin, setHoursMin] = useState('');
  const [hoursMax, setHoursMax] = useState('');
  const [filterHasKeeper, setFilterHasKeeper] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [filterStatus, setFilterStatus] = useState(''); // '' | 'active' | 'inactive'
  // Shift Details tab state
  const [shiftSortCol, setShiftSortCol] = useState('date');
  const [shiftSortDir, setShiftSortDir] = useState('desc');
  const [shiftPage, setShiftPage] = useState(0);
  // Keeper Assignments tab state
  const [assignSortCol, setAssignSortCol] = useState('animal');
  const [assignSortDir, setAssignSortDir] = useState('asc');
  const [assignPage, setAssignPage] = useState(0);
  // Shift Details tab filters
  const [filterShiftExhibit, setFilterShiftExhibit] = useState('');
  const [filterDurationMin, setFilterDurationMin] = useState('');
  const [filterDurationMax, setFilterDurationMax] = useState('');
  // Keeper Assignments tab filters
  const [filterAssignSpecies, setFilterAssignSpecies] = useState('');
  const [filterAssignActive, setFilterAssignActive] = useState('');

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

  const inDateRange = (dateStr) => {
    if (!dateFrom && !dateTo) return true;
    if (!dateStr) return false;
    const d = (dateStr.includes('T') ? dateStr.split('T')[0] : dateStr);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  const getToken = async () => {
    const { auth } = await import('../../../services/firebase');
    if (!auth.currentUser) throw new Error('Not authenticated');
    return auth.currentUser.getIdToken();
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();
        const headers = { 'Authorization': `Bearer ${token}` };
        // Phase 1: Load staff list first for faster initial render
        const staffRes = await fetch(`${API_BASE_URL}/api/staff`, { headers });
        setStaffList(await staffRes.json());
        setLoading(false);
        // Phase 2: Load schedules and assignments in background
        const [schedRes, assignRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/staff-schedules`, { headers }),
          fetch(`${API_BASE_URL}/api/keeper-assignments`, { headers }),
        ]);
        setSchedules(await schedRes.json());
        setAssignments(await assignRes.json());
      } catch (e) {
        console.error(e);
        toast.error('Failed to load report data');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Group schedules by staff (filtered by date range)
  const staffSchedulesMap = useMemo(() => {
    const map = {};
    for (const s of schedules) {
      if (!s.StaffID) continue;
      if (!inDateRange(s.WorkDate)) continue;
      if (!map[s.StaffID]) map[s.StaffID] = [];
      map[s.StaffID].push(s);
    }
    // Sort each staff's shifts by date desc
    for (const id of Object.keys(map)) {
      map[id].sort((a, b) => (b.WorkDate || '').localeCompare(a.WorkDate || ''));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedules, dateFrom, dateTo]);

  // Compute hours per staff from schedules
  const staffHoursMap = useMemo(() => {
    const map = {};
    for (const id of Object.keys(staffSchedulesMap)) {
      const shifts = staffSchedulesMap[id];
      let totalHours = 0;
      for (const s of shifts) {
        totalHours += shiftDuration(s.ShiftStart, s.ShiftEnd);
      }
      map[id] = { totalHours, shiftCount: shifts.length };
    }
    return map;
  }, [staffSchedulesMap]);

  // Group keeper assignments by staff
  const staffAssignmentsMap = useMemo(() => {
    const map = {};
    for (const a of assignments) {
      if (!a.StaffID) continue;
      if (!map[a.StaffID]) map[a.StaffID] = [];
      map[a.StaffID].push(a);
    }
    return map;
  }, [assignments]);

  const allShiftExhibits = useMemo(() => [...new Set(schedules.map(s => s.ExhibitName).filter(Boolean))].sort(), [schedules]);
  const allAssignSpecies = useMemo(() => [...new Set(assignments.map(a => a.Species).filter(Boolean))].sort(), [assignments]);

  // Build report rows
  const reportRows = useMemo(() => {
    return staffList
      .filter(s => {
        if (filterRoles.length > 0 && !filterRoles.includes(s.Role)) return false;
        if (filterStaff && String(s.StaffID) !== filterStaff) return false;
        return true;
      })
      .map(s => {
        const hours = staffHoursMap[s.StaffID] || { totalHours: 0, shiftCount: 0 };
        const keeperAssigns = staffAssignmentsMap[s.StaffID] || [];
        const activeAssigns = keeperAssigns.filter(a => !a.EndDate);
        const staffShifts = staffSchedulesMap[s.StaffID] || [];
        const avgHours = hours.shiftCount > 0 ? Math.round(hours.totalHours / hours.shiftCount * 10) / 10 : 0;
        return {
          ...s,
          name: `${s.FirstName} ${s.LastName}`,
          totalHours: Math.round(hours.totalHours * 100) / 100,
          shiftCount: hours.shiftCount,
          avgHoursPerShift: avgHours,
          activeAssignments: activeAssigns,
          allAssignments: keeperAssigns,
          totalAssignments: keeperAssigns.length,
          shifts: staffShifts,
        };
      })
      .filter(row => {
        if (shiftMin !== '' && row.shiftCount < Number(shiftMin)) return false;
        if (shiftMax !== '' && row.shiftCount > Number(shiftMax)) return false;
        if (hoursMin !== '' && row.totalHours < Number(hoursMin)) return false;
        if (hoursMax !== '' && row.totalHours > Number(hoursMax)) return false;
        if (filterHasKeeper && row.activeAssignments.length === 0) return false;
        if (filterStatus === 'active' && row.IsActive === false) return false;
        if (filterStatus === 'inactive' && row.IsActive !== false) return false;
        if (dateFrom && row.HireDate) {
          const hd = row.HireDate.includes('T') ? row.HireDate.split('T')[0] : row.HireDate;
          if (hd < dateFrom) return false;
        }
        if (dateTo && row.HireDate) {
          const hd = row.HireDate.includes('T') ? row.HireDate.split('T')[0] : row.HireDate;
          if (hd > dateTo) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortCol === 'name') return dir * a.name.localeCompare(b.name);
        if (sortCol === 'role') return dir * (a.Role || '').localeCompare(b.Role || '');
        if (sortCol === 'hours') return dir * (a.totalHours - b.totalHours);
        if (sortCol === 'shifts') return dir * (a.shiftCount - b.shiftCount);
        if (sortCol === 'assignments') return dir * (a.activeAssignments.length - b.activeAssignments.length);
        if (sortCol === 'hireDate') {
          const tA = a.HireDate ? new Date(a.HireDate).getTime() : 0;
          const tB = b.HireDate ? new Date(b.HireDate).getTime() : 0;
          return dir * (tA - tB);
        }
        return 0;
      });
  }, [staffList, staffHoursMap, staffAssignmentsMap, staffSchedulesMap, filterRoles, filterStaff, sortCol, sortDir, shiftMin, shiftMax, hoursMin, hoursMax, filterHasKeeper, filterStatus, dateFrom, dateTo]);

  const activeStaffFilterCount = [filterRoles.length > 0, !!filterStaff, shiftMin !== '', shiftMax !== '', hoursMin !== '', hoursMax !== '', filterHasKeeper, !!filterStatus, !!filterShiftExhibit, filterDurationMin !== '', filterDurationMax !== '', !!filterAssignSpecies, !!filterAssignActive].filter(Boolean).length;
  const resetStaffFilters = () => { setFilterRoles([]); setFilterStaff(''); setShiftMin(''); setShiftMax(''); setHoursMin(''); setHoursMax(''); setFilterHasKeeper(false); setFilterStatus(''); setFilterShiftExhibit(''); setFilterDurationMin(''); setFilterDurationMax(''); setFilterAssignSpecies(''); setFilterAssignActive(''); setPageIndex(0); };

  const toggleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const SortHeader = ({ col, children }) => (
    <th
      onClick={() => toggleSort(col)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      data-sorted={sortCol === col ? sortDir : undefined}
    >
      {children}
      {' '}
      {sortCol === col
        ? (sortDir === 'asc' ? <ChevronUp size={12} className="sort-icon" /> : <ChevronDown size={12} className="sort-icon" />)
        : <ChevronsUpDown size={12} className="sort-icon" />}
    </th>
  );

  // Totals
  const totalShifts = reportRows.reduce((sum, r) => sum + r.shiftCount, 0);
  const totalHours = reportRows.reduce((sum, r) => sum + r.totalHours, 0);
  const totalActiveAssignments = reportRows.reduce((sum, r) => sum + r.activeAssignments.length, 0);
  const totalAllAssignments = reportRows.reduce((sum, r) => sum + r.totalAssignments, 0);

  const filteredStaffList = useMemo(() => {
    if (filterRoles.length === 0) return staffList;
    return staffList.filter(s => filterRoles.includes(s.Role));
  }, [staffList, filterRoles]);

  // Flat shift rows for Shift Details tab
  const shiftRows = useMemo(() => {
    const staffMap = {};
    staffList.forEach(s => { staffMap[s.StaffID] = s; });
    return schedules
      .filter(s => {
        if (!s.StaffID) return false;
        if (!inDateRange(s.WorkDate)) return false;
        const staff = staffMap[s.StaffID];
        if (!staff) return false;
        if (filterRoles.length > 0 && !filterRoles.includes(staff.Role)) return false;
        if (filterStaff && String(s.StaffID) !== filterStaff) return false;
        if (filterStatus === 'active' && staff.IsActive === false) return false;
        if (filterStatus === 'inactive' && staff.IsActive !== false) return false;
        if (filterShiftExhibit && s.ExhibitName !== filterShiftExhibit) return false;
        return true;
      })
      .map(s => {
        const staff = staffMap[s.StaffID];
        return {
          ...s,
          name: staff ? `${staff.FirstName} ${staff.LastName}` : '—',
          role: staff?.Role || '—',
          duration: shiftDuration(s.ShiftStart, s.ShiftEnd),
        };
      })
      .filter(row => {
        if (filterDurationMin !== '' && row.duration < Number(filterDurationMin)) return false;
        if (filterDurationMax !== '' && row.duration > Number(filterDurationMax)) return false;
        return true;
      })
      .sort((a, b) => {
        const dir = shiftSortDir === 'asc' ? 1 : -1;
        if (shiftSortCol === 'name') return dir * a.name.localeCompare(b.name);
        if (shiftSortCol === 'role') return dir * (a.role || '').localeCompare(b.role || '');
        if (shiftSortCol === 'date') return dir * (a.WorkDate || '').localeCompare(b.WorkDate || '');
        if (shiftSortCol === 'duration') return dir * (a.duration - b.duration);
        if (shiftSortCol === 'exhibit') return dir * (a.ExhibitName || '').localeCompare(b.ExhibitName || '');
        return 0;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedules, staffList, filterRoles, filterStaff, filterStatus, filterShiftExhibit, filterDurationMin, filterDurationMax, dateFrom, dateTo, shiftSortCol, shiftSortDir]);

  // Flat assignment rows for Keeper Assignments tab
  const assignmentRows = useMemo(() => {
    const staffMap = {};
    staffList.forEach(s => { staffMap[s.StaffID] = s; });
    return assignments
      .filter(a => {
        if (!a.StaffID) return false;
        const staff = staffMap[a.StaffID];
        if (!staff) return false;
        if (filterRoles.length > 0 && !filterRoles.includes(staff.Role)) return false;
        if (filterStaff && String(a.StaffID) !== filterStaff) return false;
        if (filterStatus === 'active' && staff.IsActive === false) return false;
        if (filterStatus === 'inactive' && staff.IsActive !== false) return false;
        if (filterAssignSpecies && a.Species !== filterAssignSpecies) return false;
        if (filterAssignActive === 'active' && a.EndDate) return false;
        if (filterAssignActive === 'ended' && !a.EndDate) return false;
        return true;
      })
      .map(a => {
        const staff = staffMap[a.StaffID];
        return {
          ...a,
          name: staff ? `${staff.FirstName} ${staff.LastName}` : '—',
          role: staff?.Role || '—',
          isActiveAssign: !a.EndDate,
        };
      })
      .sort((a, b) => {
        const dir = assignSortDir === 'asc' ? 1 : -1;
        if (assignSortCol === 'name') return dir * a.name.localeCompare(b.name);
        if (assignSortCol === 'role') return dir * (a.role || '').localeCompare(b.role || '');
        if (assignSortCol === 'animal') return dir * (a.AnimalName || '').localeCompare(b.AnimalName || '');
        if (assignSortCol === 'species') return dir * (a.Species || '').localeCompare(b.Species || '');
        if (assignSortCol === 'status') return dir * ((a.isActiveAssign ? 0 : 1) - (b.isActiveAssign ? 0 : 1));
        return 0;
      });
  }, [assignments, staffList, filterRoles, filterStaff, filterStatus, filterAssignSpecies, filterAssignActive, assignSortCol, assignSortDir]);

  const toggleShiftSort = (col) => {
    if (shiftSortCol === col) setShiftSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setShiftSortCol(col); setShiftSortDir('asc'); }
  };

  const toggleAssignSort = (col) => {
    if (assignSortCol === col) setAssignSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setAssignSortCol(col); setAssignSortDir('asc'); }
  };

  const ShiftSortHeader = ({ col, children }) => (
    <th onClick={() => toggleShiftSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }} data-sorted={shiftSortCol === col ? shiftSortDir : undefined}>
      {children}{' '}
      {shiftSortCol === col
        ? (shiftSortDir === 'asc' ? <ChevronUp size={12} className="sort-icon" /> : <ChevronDown size={12} className="sort-icon" />)
        : <ChevronsUpDown size={12} className="sort-icon" />}
    </th>
  );

  const AssignSortHeader = ({ col, children }) => (
    <th onClick={() => toggleAssignSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }} data-sorted={assignSortCol === col ? assignSortDir : undefined}>
      {children}{' '}
      {assignSortCol === col
        ? (assignSortDir === 'asc' ? <ChevronUp size={12} className="sort-icon" /> : <ChevronDown size={12} className="sort-icon" />)
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

  if (loading) return <div className="admin-page"><div className="admin-table-loading">Loading report data...</div></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header-container" style={{ marginBottom: 18 }}>
        <div>
          <h1 className="admin-page-title"><Users size={26} className="title-icon" /> Employee Report</h1>
          <p className="admin-page-subtitle">Detailed schedule hours breakdown and keeper assignments per employee</p>
        </div>
        <button
          className="dr-details-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}
          disabled={reportRows.length === 0}
          onClick={() => {
            const staffData = reportRows.map(r => ({
              'Employee': r.name, 'Role': r.Role || '', 'Email': r.Email || '',
              'Phone': r.ContactNumber || '', 'Shifts': r.shiftCount,
              'Total Hours': r.totalHours.toFixed(1), 'Avg Hours/Shift': r.avgHoursPerShift || '',
              'Active Assignments': r.activeAssignments.length, 'Total Assignments': r.totalAssignments,
            }));
            const shiftData = reportRows.flatMap(r =>
              r.shifts.map(s => ({
                'Employee': r.name, 'Role': r.Role || '',
                'Date': s.WorkDate ? new Date(s.WorkDate.includes('T') ? s.WorkDate.split('T')[0] : s.WorkDate).toLocaleDateString() : '',
                'Start': s.ShiftStart || '', 'End': s.ShiftEnd || '',
                'Duration (hrs)': shiftDuration(s.ShiftStart, s.ShiftEnd) || '',
                'Exhibit': s.ExhibitName || '',
              }))
            );
            const assignData = reportRows.flatMap(r =>
              r.allAssignments.map(a => ({
                'Employee': r.name, 'Role': r.Role || '',
                'Animal': a.AnimalName || '', 'Species': a.Species || '',
                'Start Date': a.StartDate || '', 'End Date': a.EndDate || '',
                'Status': a.EndDate ? 'Ended' : 'Active',
              }))
            );
            const now = new Date();
            const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
            exportSectionsToSingleSheet([
              { name: 'Employee Summary', data: staffData },
              { name: 'Shift Details', data: shiftData },
              { name: 'Keeper Assignments', data: assignData },
            ], `Employee Report Snapshot ${stamp}`, { reportName: 'Employee Report', dateFrom, dateTo });
            toast.success('Employee report downloaded.');
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
        <button className={`dr-tab${activeTab === 'staff' ? ' active' : ''}`} onClick={() => setActiveTab('staff')}>
          <Users size={14} /> Staff Summary
        </button>
        <button className={`dr-tab${activeTab === 'shifts' ? ' active' : ''}`} onClick={() => setActiveTab('shifts')}>
          <Calendar size={14} /> Shift Details
        </button>
        <button className={`dr-tab${activeTab === 'assignments' ? ' active' : ''}`} onClick={() => setActiveTab('assignments')}>
          <PawPrint size={14} /> Keeper Assignments
        </button>
      </div>

      {activeTab === 'overview' && (
        <StaffReportOverview staffList={staffList} schedules={schedules} assignments={assignments} />
      )}

      {activeTab !== 'overview' && (<>
        {/* Filters Row 1: date range filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
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
          {activeStaffFilterCount > 0 && (
            <button onClick={resetStaffFilters}
              style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
              <X size={12} /> Reset
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: '0.68rem', marginLeft: 2 }}>{activeStaffFilterCount}</span>
            </button>
          )}
        </div>

        {/* Filters Row 2: role chips + staff select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          {/* Role chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 2 }}>Role</span>
            {ROLES.map(r => {
              const rc = roleColors[r] || { bg: 'var(--adm-accent-dim)', color: 'var(--adm-accent)' };
              const active = filterRoles.includes(r);
              return (
                <button key={r} onClick={() => setFilterRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])}
                  style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? rc.color : 'var(--adm-border)'}`, background: active ? rc.bg : 'transparent', color: active ? rc.color : 'var(--adm-text-secondary)', transition: 'all 0.15s' }}>
                  {r}
                </button>
              );
            })}
          </div>
          <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />
          <AdminSelect
            value={filterStaff}
            onChange={val => setFilterStaff(val)}
            options={[{ value: '', label: 'All Staff' }, ...filteredStaffList.map(s => ({ value: String(s.StaffID), label: `${s.FirstName} ${s.LastName}` }))]}
            placeholder="All Staff"
            searchable
            width={200}
          />
        </div>

        {/* Filters Row 3: advanced range filters (tab-specific) */}
        {(activeTab === 'staff' || activeTab === 'shifts' || activeTab === 'assignments') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap', padding: '10px 14px', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 8 }}>
            {/* Shift Count Range — Staff Summary only */}
            {activeTab === 'staff' && (<>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shifts</span>
                <input type="number" min="0" placeholder="Min" value={shiftMin} onChange={e => setShiftMin(e.target.value)}
                  style={{ width: 52, padding: '4px 7px', borderRadius: 6, border: '1px solid var(--adm-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', fontSize: '0.78rem' }} />
                <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.75rem' }}>–</span>
                <input type="number" min="0" placeholder="Max" value={shiftMax} onChange={e => setShiftMax(e.target.value)}
                  style={{ width: 52, padding: '4px 7px', borderRadius: 6, border: '1px solid var(--adm-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', fontSize: '0.78rem' }} />
              </div>

              <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />

              {/* Hours Range */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hours</span>
                <input type="number" min="0" placeholder="Min" value={hoursMin} onChange={e => setHoursMin(e.target.value)}
                  style={{ width: 56, padding: '4px 7px', borderRadius: 6, border: '1px solid var(--adm-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', fontSize: '0.78rem' }} />
                <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.75rem' }}>–</span>
                <input type="number" min="0" placeholder="Max" value={hoursMax} onChange={e => setHoursMax(e.target.value)}
                  style={{ width: 56, padding: '4px 7px', borderRadius: 6, border: '1px solid var(--adm-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', fontSize: '0.78rem' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--adm-text-muted)' }}>hrs</span>
              </div>

              <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />
            </>)}

            {/* Exhibit + Duration — Shift Details only */}
            {activeTab === 'shifts' && (<>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exhibit</span>
                <AdminSelect
                  value={filterShiftExhibit}
                  onChange={setFilterShiftExhibit}
                  width="160px"
                  options={[{ value: '', label: 'All Exhibits' }, ...allShiftExhibits.map(e => ({ value: e, label: e }))]}
                />
              </div>
              <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</span>
                <input type="number" min="0" step="0.5" placeholder="Min" value={filterDurationMin} onChange={e => setFilterDurationMin(e.target.value)}
                  style={{ width: 56, padding: '4px 7px', borderRadius: 6, border: '1px solid var(--adm-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', fontSize: '0.78rem' }} />
                <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.75rem' }}>–</span>
                <input type="number" min="0" step="0.5" placeholder="Max" value={filterDurationMax} onChange={e => setFilterDurationMax(e.target.value)}
                  style={{ width: 56, padding: '4px 7px', borderRadius: 6, border: '1px solid var(--adm-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', fontSize: '0.78rem' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--adm-text-muted)' }}>hrs</span>
              </div>
            </>)}

            {/* Species + Assignment Status — Keeper Assignments only */}
            {activeTab === 'assignments' && (<>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Species</span>
                <AdminSelect
                  value={filterAssignSpecies}
                  onChange={setFilterAssignSpecies}
                  width="160px"
                  searchable
                  options={[{ value: '', label: 'All Species' }, ...allAssignSpecies.map(s => ({ value: s, label: s }))]}
                />
              </div>
              <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignment</span>
                {[['', 'All'], ['active', 'Active'], ['ended', 'Ended']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setFilterAssignActive(val)}
                    style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${filterAssignActive === val ? (val === 'active' ? '#10b981' : val === 'ended' ? '#ef4444' : 'var(--adm-accent)') : 'var(--adm-border)'}`, background: filterAssignActive === val ? (val === 'active' ? 'rgba(16,185,129,0.15)' : val === 'ended' ? 'rgba(239,68,68,0.12)' : 'var(--adm-accent-dim)') : 'transparent', color: filterAssignActive === val ? (val === 'active' ? '#10b981' : val === 'ended' ? '#ef4444' : 'var(--adm-accent)') : 'var(--adm-text-secondary)', transition: 'all 0.15s' }}>
                    {lbl}
                  </button>
                ))}
              </div>
              <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />
            </>)}

            {/* Has Keeper + Status — Staff Summary + Assignments */}
            {(activeTab === 'staff' || activeTab === 'assignments') && (<>
              <button onClick={() => setFilterHasKeeper(p => !p)}
                style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${filterHasKeeper ? '#10b981' : 'var(--adm-border)'}`, background: filterHasKeeper ? 'rgba(16,185,129,0.15)' : 'transparent', color: filterHasKeeper ? '#10b981' : 'var(--adm-text-secondary)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}>
                🐾 Has Keeper Assignments
              </button>

              <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />

              {/* Staff Status — Staff Summary + Assignments */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                {[['', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setFilterStatus(val)}
                    style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${filterStatus === val ? 'var(--adm-accent)' : 'var(--adm-border)'}`, background: filterStatus === val ? 'var(--adm-accent-dim)' : 'transparent', color: filterStatus === val ? 'var(--adm-accent)' : 'var(--adm-text-secondary)', transition: 'all 0.15s' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </>)}
          </div>
        )}

        {/* Summary bar */}
        {activeTab === 'staff' && (
          <div style={{
            display: 'flex', gap: 20, marginBottom: 14, padding: '10px 16px',
            background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 8,
            fontSize: '0.8rem', color: 'var(--adm-text-secondary)', alignItems: 'center', flexWrap: 'wrap',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              Showing <strong style={{ margin: '0 3px' }}>{reportRows.length}</strong> of {staffList.length} employees
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={13} /> <strong>{totalShifts}</strong> total shifts
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={13} /> <strong>{totalHours.toFixed(1)}</strong> total hours
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <PawPrint size={13} /> <strong>{totalActiveAssignments}</strong> active / <strong>{totalAllAssignments}</strong> total keeper assignments
            </span>
          </div>
        )}
        {activeTab === 'shifts' && (
          <div style={{
            display: 'flex', gap: 20, marginBottom: 14, padding: '10px 16px',
            background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 8,
            fontSize: '0.8rem', color: 'var(--adm-text-secondary)', alignItems: 'center', flexWrap: 'wrap',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              Showing <strong style={{ margin: '0 3px' }}>{shiftRows.length}</strong> shifts
            </span>
          </div>
        )}
        {activeTab === 'assignments' && (
          <div style={{
            display: 'flex', gap: 20, marginBottom: 14, padding: '10px 16px',
            background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 8,
            fontSize: '0.8rem', color: 'var(--adm-text-secondary)', alignItems: 'center', flexWrap: 'wrap',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              Showing <strong style={{ margin: '0 3px' }}>{assignmentRows.length}</strong> keeper assignments
            </span>
          </div>
        )}

        {/* ── Staff Summary Table ── */}
        {activeTab === 'staff' && (
          <>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <SortHeader col="name">Employee</SortHeader>
                    <SortHeader col="role">Role</SortHeader>
                    <SortHeader col="hireDate">Hire Date</SortHeader>
                    <th>Email</th>
                    <th>Phone</th>
                    <SortHeader col="shifts">Shifts</SortHeader>
                    <SortHeader col="hours">Total Hours</SortHeader>
                    <th>Avg / Shift</th>
                    <SortHeader col="assignments">Keeper Assignments</SortHeader>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.length === 0 ? (
                    <tr className="no-hover">
                      <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--adm-text-muted)' }}>
                        No staff members found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    reportRows.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE).map(row => {
                      const rc = roleColors[row.Role] || { bg: 'var(--adm-accent-dim)', color: 'var(--adm-accent)' };
                      return (
                        <tr key={row.StaffID}>
                          <td style={{ fontWeight: 600, color: 'var(--adm-text-primary)' }}>{row.name}</td>
                          <td>
                            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: rc.bg, color: rc.color, whiteSpace: 'nowrap' }}>
                              {row.Role}
                            </span>
                          </td>
                          <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>{formatDate(row.HireDate)}</td>
                          <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>{row.Email || '—'}</td>
                          <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>{row.ContactNumber || '—'}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.88rem' }}>
                            {row.shiftCount || <span style={{ color: 'var(--adm-text-muted)' }}>0</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {row.totalHours > 0 ? (
                              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--adm-text-primary)' }}>
                                {row.totalHours.toFixed(1)} hrs
                              </span>
                            ) : (
                              <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.82rem' }}>0 hrs</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--adm-text-secondary)' }}>
                            {row.avgHoursPerShift > 0 ? `${row.avgHoursPerShift} hrs` : '—'}
                          </td>
                          <td>
                            {row.activeAssignments.length > 0 ? (
                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--adm-text-primary)' }}>
                                {row.activeAssignments.length} active
                                {row.totalAssignments > row.activeAssignments.length && (
                                  <span style={{ color: 'var(--adm-text-muted)', fontWeight: 400 }}> / {row.totalAssignments} total</span>
                                )}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.78rem' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {reportRows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'var(--adm-bg-surface-2)', fontWeight: 700, fontSize: '0.82rem' }}>
                      <td colSpan={5} style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--adm-text-secondary)' }}>Totals</td>
                      <td style={{ textAlign: 'center', color: 'var(--adm-text-primary)' }}>{totalShifts}</td>
                      <td style={{ textAlign: 'center', color: 'var(--adm-text-primary)' }}>{totalHours.toFixed(1)} hrs</td>
                      <td></td>
                      <td style={{ color: 'var(--adm-text-primary)', paddingLeft: 12 }}>{totalActiveAssignments} active / {totalAllAssignments} total</td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {renderPagination(reportRows.length, pageIndex, setPageIndex, 'employees')}
            </div>
          </>
        )}

        {/* ── Shift Details Table ── */}
        {activeTab === 'shifts' && (
          <>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <ShiftSortHeader col="name">Employee</ShiftSortHeader>
                    <ShiftSortHeader col="role">Role</ShiftSortHeader>
                    <ShiftSortHeader col="date">Date</ShiftSortHeader>
                    <th>Start</th>
                    <th>End</th>
                    <ShiftSortHeader col="duration">Duration</ShiftSortHeader>
                    <ShiftSortHeader col="exhibit">Exhibit</ShiftSortHeader>
                  </tr>
                </thead>
                <tbody>
                  {shiftRows.length === 0 ? (
                    <tr className="no-hover">
                      <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--adm-text-muted)' }}>
                        No shifts found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    shiftRows.slice(shiftPage * PAGE_SIZE, (shiftPage + 1) * PAGE_SIZE).map((sh, i) => {
                      const rc = roleColors[sh.role] || { bg: 'var(--adm-accent-dim)', color: 'var(--adm-accent)' };
                      return (
                        <tr key={`${sh.ScheduleID || i}`}>
                          <td style={{ fontWeight: 600, color: 'var(--adm-text-primary)' }}>{sh.name}</td>
                          <td>
                            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: rc.bg, color: rc.color, whiteSpace: 'nowrap' }}>
                              {sh.role}
                            </span>
                          </td>
                          <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>{formatDate(sh.WorkDate)}</td>
                          <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>{formatTime(sh.ShiftStart)}</td>
                          <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>{formatTime(sh.ShiftEnd)}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.88rem' }}>
                            {sh.duration > 0 ? `${sh.duration} hrs` : '—'}
                          </td>
                          <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>
                            {sh.ExhibitName ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <MapPin size={10} style={{ color: 'var(--adm-text-muted)' }} />
                                {sh.ExhibitName}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {renderPagination(shiftRows.length, shiftPage, setShiftPage, 'shifts')}
            </div>
          </>
        )}

        {/* ── Keeper Assignments Table ── */}
        {activeTab === 'assignments' && (
          <>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <AssignSortHeader col="name">Employee</AssignSortHeader>
                    <AssignSortHeader col="role">Role</AssignSortHeader>
                    <AssignSortHeader col="animal">Animal</AssignSortHeader>
                    <AssignSortHeader col="species">Species</AssignSortHeader>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <AssignSortHeader col="status">Status</AssignSortHeader>
                  </tr>
                </thead>
                <tbody>
                  {assignmentRows.length === 0 ? (
                    <tr className="no-hover">
                      <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--adm-text-muted)' }}>
                        No keeper assignments found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    assignmentRows.slice(assignPage * PAGE_SIZE, (assignPage + 1) * PAGE_SIZE).map((a, i) => {
                      const rc = roleColors[a.role] || { bg: 'var(--adm-accent-dim)', color: 'var(--adm-accent)' };
                      return (
                        <tr key={`${a.AssignmentID || i}`}>
                          <td style={{ fontWeight: 600, color: 'var(--adm-text-primary)' }}>{a.name}</td>
                          <td>
                            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: rc.bg, color: rc.color, whiteSpace: 'nowrap' }}>
                              {a.role}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--adm-text-primary)' }}>{a.AnimalName || '—'}</td>
                          <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>{a.Species || '—'}</td>
                          <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>{formatDate(a.StartDate)}</td>
                          <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>{a.EndDate ? formatDate(a.EndDate) : '—'}</td>
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                              fontSize: '0.75rem', fontWeight: 600,
                              background: a.isActiveAssign ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                              color: a.isActiveAssign ? '#10b981' : '#ef4444',
                            }}>
                              {a.isActiveAssign ? 'Active' : 'Ended'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {renderPagination(assignmentRows.length, assignPage, setAssignPage, 'assignments')}
            </div>
          </>
        )}
      </>)}
    </div>
  );
};

export default StaffReport;
