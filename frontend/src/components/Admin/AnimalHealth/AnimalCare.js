import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '../AdminTable.css';
import './AnimalHealth.css';
import {
  UtensilsCrossed, Users, Search, Plus, Edit2, Trash2,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight
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
  getAllFeedingSchedules, createFeedingSchedule,
  updateFeedingSchedule, deleteFeedingSchedule
} from '../../../services/feedingScheduleService';
import {
  getAllKeeperAssignments, createKeeperAssignment,
  updateKeeperAssignment, deleteKeeperAssignment
} from '../../../services/keeperAssignmentService';
import { getAnimalsForDropdown, getStaffForDropdown } from '../../../services/animalHealthService';

/* ── Helpers ─────────────────────────────────────────────── */
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

const fmtTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

/* ── Shared Paginated Table ──────────────────────────────── */
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
const AnimalCare = () => {
  const [activeTab, setActiveTab] = useState('feedings');
  const [search, setSearch] = useState('');

  // Dropdowns
  const [animals, setAnimals] = useState([]);
  const [staff, setStaff] = useState([]);

  // Feeding Schedules
  const [feedings, setFeedings] = useState([]);
  const [feedingsLoading, setFeedingsLoading] = useState(true);
  const [feedingsSorting, setFeedingsSorting] = useState([{ id: 'FeedTime', desc: false }]);
  const [feedingModal, setFeedingModal] = useState(false);
  const [editingFeeding, setEditingFeeding] = useState(null);
  const [feedingForm, setFeedingForm] = useState({ AnimalID: '', FeedTime: '', FoodType: '', StaffID: '' });

  // Keeper Assignments
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsSorting, setAssignmentsSorting] = useState([{ id: 'StartDate', desc: true }]);
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({ AnimalID: '', StaffID: '', StartDate: '', EndDate: '' });

  /* ── Load data ─────────────────────────────────────────── */
  const loadAll = useCallback(async () => {
    try {
      const [animalList, staffList] = await Promise.all([
        getAnimalsForDropdown(), getStaffForDropdown()
      ]);
      setAnimals(animalList);
      setStaff(staffList);
    } catch { /* non-fatal */ }

    try { setFeedingsLoading(true); setFeedings(await getAllFeedingSchedules()); }
    catch (e) { toast.error(e.message || 'Failed to load feeding schedules.'); }
    finally { setFeedingsLoading(false); }

    try { setAssignmentsLoading(true); setAssignments(await getAllKeeperAssignments()); }
    catch (e) { toast.error(e.message || 'Failed to load keeper assignments.'); }
    finally { setAssignmentsLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Filtered data ─────────────────────────────────────── */
  const filteredFeedings = useMemo(() => feedings.filter(f =>
    f.AnimalName?.toLowerCase().includes(search.toLowerCase()) ||
    f.Species?.toLowerCase().includes(search.toLowerCase()) ||
    f.FoodType?.toLowerCase().includes(search.toLowerCase()) ||
    f.StaffName?.toLowerCase().includes(search.toLowerCase())
  ), [feedings, search]);

  const filteredAssignments = useMemo(() => assignments.filter(a =>
    a.AnimalName?.toLowerCase().includes(search.toLowerCase()) ||
    a.Species?.toLowerCase().includes(search.toLowerCase()) ||
    a.KeeperName?.toLowerCase().includes(search.toLowerCase()) ||
    a.KeeperRole?.toLowerCase().includes(search.toLowerCase())
  ), [assignments, search]);

  /* ── Stats ─────────────────────────────────────────────── */
  const activeAssignments = assignments.filter(a => !a.EndDate).length;
  const uniqueAnimalsWithKeepers = new Set(assignments.filter(a => !a.EndDate).map(a => a.AnimalID)).size;

  /* ── Feeding CRUD ──────────────────────────────────────── */
  const openFeedingModal = (rec = null) => {
    if (rec) {
      setEditingFeeding(rec);
      setFeedingForm({
        AnimalID: String(rec.AnimalID),
        FeedTime: rec.FeedTime ? rec.FeedTime.slice(0, 16) : '',
        FoodType: rec.FoodType || '',
        StaffID: String(rec.StaffID)
      });
    } else {
      setEditingFeeding(null);
      setFeedingForm({ AnimalID: '', FeedTime: '', FoodType: '', StaffID: '' });
    }
    setFeedingModal(true);
  };

  const handleFeedingSubmit = async (e) => {
    e.preventDefault();
    if (!feedingForm.AnimalID || !feedingForm.FeedTime || !feedingForm.FoodType || !feedingForm.StaffID) {
      toast.error('Please fill in all required fields.');
      return;
    }
    try {
      if (editingFeeding) {
        await updateFeedingSchedule(editingFeeding.ScheduleID, feedingForm);
        toast.success('Feeding schedule updated.');
      } else {
        await createFeedingSchedule(feedingForm);
        toast.success('Feeding schedule created.');
      }
      setFeedingModal(false);
      await loadAll();
    } catch (err) { toast.error(err.message || 'Failed to save feeding schedule.'); }
  };

  const handleFeedingDelete = async (id) => {
    if (!window.confirm('Delete this feeding schedule?')) return;
    try { await deleteFeedingSchedule(id); toast.success('Feeding schedule deleted.'); await loadAll(); }
    catch (err) { toast.error(err.message || 'Failed to delete.'); }
  };

  /* ── Assignment CRUD ───────────────────────────────────── */
  const openAssignmentModal = (rec = null) => {
    if (rec) {
      setEditingAssignment(rec);
      setAssignmentForm({
        AnimalID: String(rec.AnimalID),
        StaffID: String(rec.StaffID),
        StartDate: rec.StartDate ? rec.StartDate.split('T')[0] : '',
        EndDate: rec.EndDate ? rec.EndDate.split('T')[0] : ''
      });
    } else {
      setEditingAssignment(null);
      setAssignmentForm({ AnimalID: '', StaffID: '', StartDate: new Date().toISOString().split('T')[0], EndDate: '' });
    }
    setAssignmentModal(true);
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!assignmentForm.AnimalID || !assignmentForm.StaffID || !assignmentForm.StartDate) {
      toast.error('Please fill in all required fields.');
      return;
    }
    try {
      const payload = { ...assignmentForm };
      if (!payload.EndDate) payload.EndDate = null;
      if (editingAssignment) {
        await updateKeeperAssignment(editingAssignment.AssignmentID, payload);
        toast.success('Keeper assignment updated.');
      } else {
        await createKeeperAssignment(payload);
        toast.success('Keeper assignment created.');
      }
      setAssignmentModal(false);
      await loadAll();
    } catch (err) { toast.error(err.message || 'Failed to save keeper assignment.'); }
  };

  const handleAssignmentDelete = async (id) => {
    if (!window.confirm('Delete this keeper assignment?')) return;
    try { await deleteKeeperAssignment(id); toast.success('Keeper assignment deleted.'); await loadAll(); }
    catch (err) { toast.error(err.message || 'Failed to delete.'); }
  };

  /* ── Column definitions ────────────────────────────────── */
  const feedingColumns = useMemo(() => [
    { accessorKey: 'AnimalName', header: 'Animal', cell: ({ row }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontWeight: 600 }}>{row.original.AnimalName}</span>
        <span style={{ fontSize: '0.76rem', color: 'var(--adm-text-secondary)' }}>{row.original.Species}</span>
      </div>
    )},
    { accessorKey: 'FeedTime', header: 'Feed Time', cell: ({ row }) => {
      const ft = row.original.FeedTime;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontWeight: 600 }}>{fmtTime(ft)}</span>
          <span style={{ fontSize: '0.76rem', color: 'var(--adm-text-secondary)' }}>{fmtDate(ft)}</span>
        </div>
      );
    }},
    { accessorKey: 'FoodType', header: 'Food Type', cell: info => (
      <span style={{ fontWeight: 500 }}>{info.getValue() || '—'}</span>
    )},
    { accessorKey: 'StaffName', header: 'Assigned Staff', cell: ({ row }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span>{row.original.StaffName || '—'}</span>
        {row.original.StaffRole && <span style={{ fontSize: '0.76rem', color: 'var(--adm-text-secondary)' }}>{row.original.StaffRole}</span>}
      </div>
    )},
    { id: 'actions', header: 'Actions', enableSorting: false, size: 100, cell: ({ row }) => (
      <div className="action-buttons">
        <button className="action-btn edit" onClick={() => openFeedingModal(row.original)}><Edit2 size={16} /></button>
        <button className="action-btn delete" onClick={() => handleFeedingDelete(row.original.ScheduleID)}><Trash2 size={16} /></button>
      </div>
    )},
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [animals, staff]);

  const assignmentColumns = useMemo(() => [
    { accessorKey: 'AnimalName', header: 'Animal', cell: ({ row }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontWeight: 600 }}>{row.original.AnimalName}</span>
        <span style={{ fontSize: '0.76rem', color: 'var(--adm-text-secondary)' }}>{row.original.Species}</span>
      </div>
    )},
    { accessorKey: 'KeeperName', header: 'Keeper', cell: ({ row }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontWeight: 600 }}>{row.original.KeeperName}</span>
        <span style={{ fontSize: '0.76rem', color: 'var(--adm-text-secondary)' }}>{row.original.KeeperRole}</span>
      </div>
    )},
    { accessorKey: 'StartDate', header: 'Start Date', cell: info => fmtDate(info.getValue()) },
    { accessorKey: 'EndDate', header: 'End Date', cell: info => {
      const v = info.getValue();
      return v ? fmtDate(v) : <span style={{ color: '#16a34a', fontWeight: 600 }}>Active</span>;
    }},
    { id: 'status', header: 'Status', enableSorting: false, size: 100, cell: ({ row }) => {
      const isActive = !row.original.EndDate;
      return (
        <span className={`ah-score ${isActive ? 'ah-score-excellent' : 'ah-score-fair'}`}>
          <span className="ah-score-dot" />{isActive ? 'Active' : 'Ended'}
        </span>
      );
    }},
    { id: 'actions', header: 'Actions', enableSorting: false, size: 100, cell: ({ row }) => (
      <div className="action-buttons">
        <button className="action-btn edit" onClick={() => openAssignmentModal(row.original)}><Edit2 size={16} /></button>
        <button className="action-btn delete" onClick={() => handleAssignmentDelete(row.original.AssignmentID)}><Trash2 size={16} /></button>
      </div>
    )},
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [animals, staff]);

  /* ── Dropdown options ──────────────────────────────────── */
  const animalOptions = animals.map(a => ({ value: String(a.AnimalID), label: `${a.Name} (${a.Species})` }));
  const staffOptions = staff.map(s => ({ value: String(s.StaffID), label: `${s.FullName} — ${s.Role}` }));

  const activeCount = activeTab === 'feedings' ? filteredFeedings.length : filteredAssignments.length;

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title">
            {activeTab === 'feedings'
              ? <><UtensilsCrossed size={22} className="title-icon" /> Feeding Schedules &amp; Keeper Assignments</>
              : <><Users size={22} className="title-icon" /> Feeding Schedules &amp; Keeper Assignments</>}
          </h1>
          <p className="admin-page-subtitle">Manage daily feeding schedules and animal keeper assignments</p>
        </div>
        <div className="admin-page-actions">
          {activeTab === 'feedings' && (
            <button className="admin-btn-primary" onClick={() => openFeedingModal()}>
              <Plus size={16} /> New Feeding
            </button>
          )}
          {activeTab === 'keepers' && (
            <button className="admin-btn-primary" onClick={() => openAssignmentModal()}>
              <Plus size={16} /> New Assignment
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="ah-stats-row">
        <div className="ah-stat-card">
          <span className="ah-stat-label">Feeding Schedules</span>
          <span className="ah-stat-value">{feedings.length}</span>
          <span className="ah-stat-sub">Total active</span>
        </div>
        <div className="ah-stat-card">
          <span className="ah-stat-label">Active Keepers</span>
          <span className="ah-stat-value" style={{ color: '#8b5cf6' }}>{activeAssignments}</span>
          <span className="ah-stat-sub">Currently assigned</span>
        </div>
        <div className="ah-stat-card">
          <span className="ah-stat-label">Animals with Keepers</span>
          <span className="ah-stat-value" style={{ color: '#16a34a' }}>{uniqueAnimalsWithKeepers}</span>
          <span className="ah-stat-sub">Have active assignment</span>
        </div>
        <div className="ah-stat-card">
          <span className="ah-stat-label">Total Assignments</span>
          <span className="ah-stat-value">{assignments.length}</span>
          <span className="ah-stat-sub">All time</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="ah-tabs">
        <button className={`ah-tab${activeTab === 'feedings' ? ' active' : ''}`} onClick={() => { setActiveTab('feedings'); setSearch(''); }}>
          <UtensilsCrossed size={14} /> Feeding Schedules <span className="ah-badge">{feedings.length}</span>
        </button>
        <button className={`ah-tab${activeTab === 'keepers' ? ' active' : ''}`} onClick={() => { setActiveTab('keepers'); setSearch(''); }}>
          <Users size={14} /> Keeper Assignments <span className="ah-badge">{assignments.length}</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="admin-table-toolbar">
        <div className="admin-search-container">
          <Search size={15} className="search-icon" />
          <input className="admin-search-input"
            placeholder={activeTab === 'feedings' ? 'Search by animal, food type, or staff...' : 'Search by animal, keeper, or role...'}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="dr-count">{activeCount} result{activeCount !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Feedings Tab ─────────────────────────────────── */}
      {activeTab === 'feedings' && (
        <DataTable data={filteredFeedings} columns={feedingColumns} sorting={feedingsSorting}
          setSorting={setFeedingsSorting} loading={feedingsLoading} emptyText={search ? 'No matching schedules.' : 'No feeding schedules yet.'} />
      )}

      {/* ── Keepers Tab ──────────────────────────────────── */}
      {activeTab === 'keepers' && (
        <DataTable data={filteredAssignments} columns={assignmentColumns} sorting={assignmentsSorting}
          setSorting={setAssignmentsSorting} loading={assignmentsLoading} emptyText={search ? 'No matching assignments.' : 'No keeper assignments yet.'} />
      )}

      {/* ══════ Feeding Modal ══════ */}
      <AdminModalForm title={editingFeeding ? 'Edit Feeding Schedule' : 'New Feeding Schedule'} isOpen={feedingModal} onClose={() => setFeedingModal(false)} onSubmit={handleFeedingSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Animal *</label>
            <AdminSelect value={feedingForm.AnimalID} onChange={v => setFeedingForm(p => ({ ...p, AnimalID: v }))}
              options={animalOptions} placeholder="Select animal..." searchable />
          </div>
          <div className="form-group">
            <label>Assigned Staff *</label>
            <AdminSelect value={feedingForm.StaffID} onChange={v => setFeedingForm(p => ({ ...p, StaffID: v }))}
              options={staffOptions} placeholder="Select staff..." searchable />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Feed Time *</label>
            <input type="datetime-local" value={feedingForm.FeedTime}
              onChange={e => setFeedingForm(p => ({ ...p, FeedTime: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Food Type *</label>
            <input value={feedingForm.FoodType}
              onChange={e => setFeedingForm(p => ({ ...p, FoodType: e.target.value }))} placeholder="e.g. Bamboo, Fish, Grain mix" />
          </div>
        </div>
      </AdminModalForm>

      {/* ══════ Assignment Modal ══════ */}
      <AdminModalForm title={editingAssignment ? 'Edit Keeper Assignment' : 'New Keeper Assignment'} isOpen={assignmentModal} onClose={() => setAssignmentModal(false)} onSubmit={handleAssignmentSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Animal *</label>
            <AdminSelect value={assignmentForm.AnimalID} onChange={v => setAssignmentForm(p => ({ ...p, AnimalID: v }))}
              options={animalOptions} placeholder="Select animal..." searchable />
          </div>
          <div className="form-group">
            <label>Keeper (Staff) *</label>
            <AdminSelect value={assignmentForm.StaffID} onChange={v => setAssignmentForm(p => ({ ...p, StaffID: v }))}
              options={staffOptions} placeholder="Select keeper..." searchable />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Start Date *</label>
            <DatePickerInput value={assignmentForm.StartDate} onChange={v => setAssignmentForm(p => ({ ...p, StartDate: v }))} />
          </div>
          <div className="form-group">
            <label>End Date <span style={{ color: 'var(--adm-text-muted)', fontWeight: 400 }}>(leave blank = active)</span></label>
            <DatePickerInput value={assignmentForm.EndDate} onChange={v => setAssignmentForm(p => ({ ...p, EndDate: v }))} />
          </div>
        </div>
      </AdminModalForm>
    </div>
  );
};

export default AnimalCare;
