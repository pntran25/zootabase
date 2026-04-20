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
import TimePickerInput from '../TimePickerInput';
import AdminSelect from '../AdminSelect';
import {
  getAllFeedingSchedules, createFeedingSchedule,
  updateFeedingSchedule, deleteFeedingSchedule
} from '../../../services/feedingScheduleService';
import {
  getAllKeeperAssignments, createKeeperAssignment,
  updateKeeperAssignment, deleteKeeperAssignment
} from '../../../services/keeperAssignmentService';
import { getAnimalsForDropdown, getStaffForDropdown, getMealTimes, updateMealTimes } from '../../../services/animalHealthService';

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

const DEFAULT_MEALS = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅', time: '07:00' },
  { id: 'lunch',     label: 'Lunch',     emoji: '☀️', time: '12:00' },
  { id: 'dinner',    label: 'Dinner',    emoji: '🌙', time: '18:00' },
];

const fmtMealDisplay = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const getMealFromTime = (feedTime, mealsList) => {
  if (!feedTime || !mealsList?.length) return '';
  const hh = feedTime.slice(11, 16);
  return mealsList.find(m => m.time === hh)?.id || '';
};

const getMealLabel = (feedTime, mealsList) => {
  if (!feedTime || !mealsList?.length) return null;
  const hh = feedTime.slice(11, 16);
  return mealsList.find(m => m.time === hh)?.label || null;
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
        {!loading && data.length > 0 && table.getPageCount() > 1 && (() => {
        const pageCount = table.getPageCount();
        const pi = table.getState().pagination.pageIndex;
        let pages = [];
        if (pageCount <= 6) {
          pages = Array.from({ length: pageCount }, (_, i) => i);
        } else {
          if (pi <= 2) {
            pages = [0, 1, 2, 3, 4, '...', pageCount - 1];
          } else if (pi >= pageCount - 3) {
            pages = [0, '...', pageCount - 5, pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1];
          } else {
            pages = [0, '...', pi - 1, pi, pi + 1, '...', pageCount - 1];
          }
        }
        return (
          <div className="admin-table-pagination" style={{ borderTop: '1px solid var(--adm-border)' }}>
            <span className="admin-pagination-info">
              Page {pi + 1} of {pageCount} · {data.length} records
            </span>
            <div className="admin-pagination-controls">
              <button className="admin-pagination-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeft size={14} />
              </button>
              {pages.map((p, idx) => (
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} style={{ padding: '0 8px', color: 'var(--adm-text-secondary)' }}>...</span>
                ) : (
                  <button key={p} className={`admin-pagination-btn${pi === p ? ' active' : ''}`}
                    onClick={() => table.setPageIndex(p)}>{p + 1}</button>
                )
              ))}
              <button className="admin-pagination-btn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        );
      })()}
      </div>
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

  // Meal time config
  const [meals, setMeals] = useState(DEFAULT_MEALS);
  const [mealSettingsModal, setMealSettingsModal] = useState(false);
  const [mealSettingsForm, setMealSettingsForm] = useState({});
  const [inlineMealEdit, setInlineMealEdit] = useState(null); // meal id being edited inline
  const [inlineMealTime, setInlineMealTime] = useState('');

  // Feeding Schedules
  const [feedings, setFeedings] = useState([]);
  const [feedingsLoading, setFeedingsLoading] = useState(true);
  const [feedingsSorting, setFeedingsSorting] = useState([{ id: 'FeedTime', desc: false }]);
  const [feedingModal, setFeedingModal] = useState(false);
  const [editingFeeding, setEditingFeeding] = useState(null);
  const [feedingForm, setFeedingForm] = useState({ AnimalID: '', FeedTime: '', FoodType: '', StaffID: '', Quantity: '', Unit: '', Frequency: '', SpecialInstructions: '' });

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
      const [animalList, staffList, mealList] = await Promise.all([
        getAnimalsForDropdown(), getStaffForDropdown(), getMealTimes()
      ]);
      setAnimals(animalList);
      setStaff(staffList);
      if (mealList?.length) setMeals(mealList);
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
        StaffID: String(rec.StaffID),
        Quantity: rec.Quantity != null ? String(rec.Quantity) : '',
        Unit: rec.Unit || '',
        Frequency: rec.Frequency || '',
        SpecialInstructions: rec.SpecialInstructions || ''
      });
    } else {
      setEditingFeeding(null);
      setFeedingForm({ AnimalID: '', FeedTime: '', FoodType: '', StaffID: '', Quantity: '', Unit: '', Frequency: '', SpecialInstructions: '' });
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

  /* ── Meal settings ─────────────────────────────────────── */
  const openMealSettings = () => {
    const form = {};
    meals.forEach(m => { form[m.id] = m.time; });
    setMealSettingsForm(form);
    setMealSettingsModal(true);
  };

  const handleInlineMealSave = async (mealId, newTime) => {
    if (!newTime) { setInlineMealEdit(null); return; }
    const updated = meals.map(m => ({ id: m.id, time: m.id === mealId ? newTime : m.time }));
    try {
      const result = await updateMealTimes(updated);
      if (result?.length) setMeals(result);
      toast.success('Meal time updated.');
    } catch (err) { toast.error(err.message || 'Failed to update meal time.'); }
    setInlineMealEdit(null);
  };

  const handleMealSettingsSave = async (e) => {
    e.preventDefault();
    try {
      const updated = meals.map(m => ({ id: m.id, time: mealSettingsForm[m.id] || m.time }));
      const result = await updateMealTimes(updated);
      if (result?.length) setMeals(result);
      setMealSettingsModal(false);
      toast.success('Meal times updated.');
    } catch (err) { toast.error(err.message || 'Failed to update meal times.'); }
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
      setAssignmentForm({ AnimalID: '', StaffID: '', StartDate: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0], EndDate: '' });
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
      const meal = getMealLabel(ft, meals);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {meal && <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{meal}</span>}
          <span style={{ fontWeight: meal ? 400 : 600, color: meal ? 'var(--adm-text-secondary)' : 'inherit', fontSize: '0.82rem' }}>{fmtTime(ft)}</span>
        </div>
      );
    }},
    { accessorKey: 'FoodType', header: 'Food Type', cell: info => (
      <span style={{ fontWeight: 500 }}>{info.getValue() || '—'}</span>
    )},
    { accessorKey: 'Quantity', header: 'Quantity', cell: ({ row }) => {
      const q = row.original.Quantity;
      const u = row.original.Unit;
      return <span>{q ? `${q} ${u || ''}`.trim() : '—'}</span>;
    }},
    { accessorKey: 'Frequency', header: 'Frequency', cell: info => (
      <span>{info.getValue() || '—'}</span>
    )},
    { accessorKey: 'SpecialInstructions', header: 'Special Instructions', cell: info => (
      <span style={{ fontSize: '0.82rem' }}>{info.getValue() || '—'}</span>
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
  ], [animals, staff, meals]);

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
  const staffOptions = staff
    .filter(s => s.Role === 'Caretaker')
    .sort((a, b) => a.FullName.localeCompare(b.FullName))
    .map(s => ({ value: String(s.StaffID), label: s.FullName }));

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
            <div className="meal-selector">
              {meals.map(meal => {
                const selected = getMealFromTime(feedingForm.FeedTime, meals) === meal.id;
                const isEditing = inlineMealEdit === meal.id;
                return (
                  <div key={meal.id} className={`meal-card-wrap${isEditing ? ' editing' : ''}`}>
                    {isEditing ? (
                      <div className="meal-card-edit">
                        <span className="meal-emoji">{meal.emoji}</span>
                        <span className="meal-label" style={{ color: 'var(--adm-accent)' }}>{meal.label}</span>
                        <TimePickerInput value={inlineMealTime} onChange={setInlineMealTime} />
                        <div className="meal-card-edit-actions">
                          <button type="button" className="meal-save-btn"
                            onClick={() => handleInlineMealSave(meal.id, inlineMealTime)}>
                            Save
                          </button>
                          <button type="button" className="meal-cancel-btn" onClick={() => setInlineMealEdit(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`meal-btn${selected ? ' active' : ''}`}
                        style={{ width: '100%' }}
                        onClick={() => {
                          const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
                          setFeedingForm(p => ({ ...p, FeedTime: `${today}T${meal.time}` }));
                        }}
                      >
                        <span className="meal-emoji">{meal.emoji}</span>
                        <span className="meal-label">{meal.label}</span>
                        <span className="meal-time">{fmtMealDisplay(meal.time)}</span>
                        <span className="meal-edit-hint">
                          <Edit2 size={10} /> edit time
                        </span>
                      </button>
                    )}
                    {!isEditing && (
                      <button type="button" className="meal-edit-btn" title="Change time"
                        onClick={e => { e.stopPropagation(); setInlineMealTime(meal.time); setInlineMealEdit(meal.id); }}>
                        <Edit2 size={11} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="form-group">
            <label>Food Type *</label>
            <input value={feedingForm.FoodType}
              onChange={e => setFeedingForm(p => ({ ...p, FoodType: e.target.value }))} placeholder="e.g. Bamboo, Fish, Grain mix" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" step="0.01" min="0" value={feedingForm.Quantity}
              onChange={e => setFeedingForm(p => ({ ...p, Quantity: e.target.value }))} placeholder="e.g. 2.5" />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <AdminSelect value={feedingForm.Unit} onChange={v => setFeedingForm(p => ({ ...p, Unit: v }))}
              options={[{ value: 'kg', label: 'kg' }, { value: 'lbs', label: 'lbs' }, { value: 'g', label: 'g' }, { value: 'oz', label: 'oz' }, { value: 'cups', label: 'cups' }, { value: 'pieces', label: 'pieces' }]}
              placeholder="Select unit..." />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Frequency</label>
            <AdminSelect value={feedingForm.Frequency} onChange={v => setFeedingForm(p => ({ ...p, Frequency: v }))}
              options={[{ value: 'Once daily', label: 'Once daily' }, { value: 'Twice daily', label: 'Twice daily' }, { value: '3x daily', label: '3x daily' }, { value: 'Every other day', label: 'Every other day' }, { value: 'Weekly', label: 'Weekly' }, { value: 'As needed', label: 'As needed' }]}
              placeholder="Select frequency..." />
          </div>
          <div className="form-group">
            <label>Special Instructions</label>
            <input value={feedingForm.SpecialInstructions}
              onChange={e => setFeedingForm(p => ({ ...p, SpecialInstructions: e.target.value }))} placeholder="e.g. Mix with water, serve warm" />
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
