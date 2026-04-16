import React, { useState, useEffect, useMemo } from 'react';
import '../AdminTable.css';
import { CalendarDays, Search, Plus, Edit2, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, Star, Image as ImageIcon } from 'lucide-react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { toast } from 'sonner';
import AdminModalForm from '../AdminModalForm';
import AdminSelect from '../AdminSelect';
import TimePickerInput from '../TimePickerInput';
import DatePickerInput from '../DatePickerInput';
import eventService from '../../../services/eventService';
import { getExhibits } from '../../../services/exhibitService';
import { API_BASE_URL } from '../../../services/apiClient';

const EVENT_CATEGORY_COLORS = {
  'Family':       { background: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' },
  'Education':    { background: '#dcfce7', color: '#166534', borderColor: '#86efac' },
  'Special':      { background: '#f3e8ff', color: '#6b21a8', borderColor: '#d8b4fe' },
  'Seasonal':     { background: '#fef9c3', color: '#854d0e', borderColor: '#fde047' },
  'Members Only': { background: '#ccfbf1', color: '#065f46', borderColor: '#5eead4' },
};

const shiftTime = (timeStr, deltaHours) => {
  if (!timeStr) return timeStr;
  const [h, m] = timeStr.split(':').map(Number);
  const newH = Math.max(0, Math.min(23, h + deltaHours));
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

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

const EMPTY_FORM = {
  name: '', date: '', endDate: '', startTime: '', endTime: '', exhibit: '', capacity: 0,
  description: '', category: '', isFeatured: false, price: 0,
};

const ManageEvents = () => {
  const EVENT_CATEGORIES = Object.keys(EVENT_CATEGORY_COLORS);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [exhibitsList, setExhibitsList] = useState([]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [data, exhData] = await Promise.all([eventService.getAllEvents(), getExhibits()]);
      setEvents(data);
      setExhibitsList(exhData.map(e => ({ value: e.ExhibitName, label: e.ExhibitName })));
    } catch (err) {
      console.error('Failed to load events:', err);
      toast.error(err.message || 'Failed to load events.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredEvents = useMemo(() =>
    events.filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(search.toLowerCase()) ||
        event.exhibit.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !filterCategory || event.category === filterCategory;
      return matchesSearch && matchesCategory;
    }), [events, search, filterCategory]);

  const handleOpenModal = (event = null) => {
    setImageFile(null);
    if (event) {
      setEditingEvent(event);
      setPreviewUrl(event.imageUrl ? (event.imageUrl?.startsWith('http') ? event.imageUrl : `${API_BASE_URL}${event.imageUrl}`) : null);
      setFormData({
        name: event.name,
        date: event.date,
        endDate: event.endDate || '',
        startTime: event.startTime,
        endTime: event.endTime,
        exhibit: event.exhibit,
        capacity: event.capacity,
        description: event.description || '',
        category: event.category || '',
        isFeatured: event.isFeatured || false,
        price: event.price || 0,
      });
    } else {
      setEditingEvent(null);
      setPreviewUrl(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(id);
        setEvents(prev => prev.filter(e => e.id !== id));
        toast.success('Event deleted.');
      } catch (err) {
        toast.error(err.message || 'Failed to delete event.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date) {
      toast.error('Please select a start date.');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error('Please select both a start time and end time.');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      toast.error('Start time must be before end time.');
      return;
    }
    try {
      const startStr = formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime;
      const endStr = formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime;
      const payload = { ...formData, startTime: startStr, endTime: endStr };

      let savedId;
      if (editingEvent) {
        await eventService.updateEvent(editingEvent.id, payload);
        savedId = editingEvent.id;
        toast.success('Event updated.');
      } else {
        const created = await eventService.createEvent(payload);
        savedId = created.id;
        toast.success('Event created.');
      }
      if (imageFile && savedId) {
        try {
          await eventService.uploadEventImage(savedId, imageFile);
        } catch {
          toast.error('Event saved but image upload failed. Re-edit the event to retry.');
        }
      }
      setIsModalOpen(false);
      setImageFile(null);
      setPreviewUrl(null);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save event.');
      console.error(err);
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Event Name',
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {row.original.isFeatured && <Star size={13} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />}
          <span className="font-medium text-dark">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: info => <span className="text-secondary">{info.getValue()}</span>,
    },
    {
      id: 'timeWindow',
      header: 'Time Window',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-secondary">{row.original.startTime} – {row.original.endTime}</span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: info => {
        const cat = info.getValue();
        if (!cat) return <span className="text-secondary">—</span>;
        const s = EVENT_CATEGORY_COLORS[cat] || { background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' };
        return (
          <span className="pill-badge outline" style={{ backgroundColor: s.background, color: s.color, border: `1px solid ${s.borderColor}` }}>
            {cat}
          </span>
        );
      },
    },
    {
      accessorKey: 'exhibit',
      header: 'Location',
      cell: info => <span className="pill-badge outline">{info.getValue()}</span>,
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
      cell: info => (
        <span className="pill-badge outline" style={{ background: 'var(--adm-bg-surface-2)', color: 'var(--adm-text-secondary)' }}>
          {info.getValue()} spots
        </span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: info => (
        <span className="font-medium text-dark">
          {Number(info.getValue() || 0) === 0 ? 'Free' : `$${Number(info.getValue()).toFixed(2)}`}
        </span>
      ),
    },
    {
      id: 'modifiedBy',
      header: 'Modified By',
      enableSorting: false,
      cell: ({ row }) => {
        const { createdBy, updatedBy } = row.original;
        if (updatedBy) return <span className="text-secondary" style={{ fontSize: '0.78rem' }}>Updated by <strong>{updatedBy}</strong></span>;
        if (createdBy) return <span className="text-secondary" style={{ fontSize: '0.78rem' }}>Created by <strong>{createdBy}</strong></span>;
        return <span className="text-secondary">—</span>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="action-buttons">
          <button className="action-btn edit" onClick={() => handleOpenModal(row.original)}><Edit2 size={16} /></button>
          <button className="action-btn delete" onClick={() => handleDelete(row.original.id)}><Trash2 size={16} /></button>
        </div>
      ),
    },
  ], [events]);

  const table = useReactTable({
    data: filteredEvents,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title"><CalendarDays className="title-icon" size={26} /> Manage Events</h1>
          <p className="admin-page-subtitle">Configure daily schedules, keeper talks, and tours.</p>
        </div>
        <div className="admin-page-actions">
          <div className="admin-search-container">
            <Search className="search-icon" size={16} />
            <input type="text" placeholder="Search events..." className="admin-search-input" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--adm-border)', background: 'var(--adm-bg-surface)', color: 'var(--adm-text-primary)', fontSize: '0.82rem', cursor: 'pointer', minWidth: 140 }}
          >
            <option value="">All Categories</option>
            {EVENT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add Event
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      data-sorted={header.column.getIsSorted() || undefined}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <SortIcon column={header.column} />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr className="no-hover"><td colSpan={columns.length}>
                <div className="admin-table-loading"><div className="admin-loading-spinner" /><p>Loading events...</p></div>
              </td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr className="no-hover"><td colSpan={columns.length}>
                <div className="admin-table-empty">
                  <div className="admin-table-empty-icon"><CalendarDays size={22} /></div>
                  <p className="admin-table-empty-title">No events found</p>
                  <p className="admin-table-empty-desc">
                    {search ? 'Try adjusting your search.' : 'Add your first event to get started.'}
                  </p>
                </div>
              </td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!isLoading && table.getPageCount() > 1 && (
          <div className="admin-table-pagination">
            <span className="admin-pagination-info">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} · {filteredEvents.length} records</span>
            <div className="admin-pagination-controls">
              <button className="admin-pagination-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>←</button>
              <button className="admin-pagination-btn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>→</button>
            </div>
          </div>
        )}
      </div>

      <AdminModalForm title={editingEvent ? 'Edit Event' : 'Add New Event'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit}>
        {/* Name */}
        <div className="form-group">
          <label>Event Name</label>
          <input type="text" placeholder="e.g. Lion Keeper Talk" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
        </div>

        {/* Start Date + End Date */}
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <DatePickerInput
              value={formData.date}
              onChange={val => setFormData({ ...formData, date: val })}
              placeholder="Select start date"
              allowFuture
            />
          </div>
          <div className="form-group">
            <label>End Date <span style={{ fontWeight: 400, color: 'var(--adm-text-muted)', fontSize: '0.8rem' }}>(optional)</span></label>
            <DatePickerInput
              value={formData.endDate}
              onChange={val => setFormData({ ...formData, endDate: val })}
              placeholder="Same as start date"
              allowFuture
            />
          </div>
        </div>

        {/* Location */}
        <div className="form-group">
          <label>Location (Exhibit)</label>
          <AdminSelect
            value={formData.exhibit}
            onChange={val => setFormData({ ...formData, exhibit: val })}
            options={exhibitsList}
            placeholder="Select exhibit..."
            searchable
          />
        </div>

        {/* Start + End Time */}
        <div className="form-row">
          <div className="form-group">
            <label>Start Time</label>
            <TimePickerInput
              value={formData.startTime}
              onChange={val => {
                const end = formData.endTime;
                const newEnd = end && val >= end ? shiftTime(val, 1) : end;
                setFormData({ ...formData, startTime: val, endTime: newEnd });
              }}
              placeholder="Select start time"
            />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <TimePickerInput
              value={formData.endTime}
              onChange={val => {
                const start = formData.startTime;
                const newStart = start && val <= start ? shiftTime(val, -1) : start;
                setFormData({ ...formData, endTime: val, startTime: newStart });
              }}
              placeholder="Select end time"
            />
          </div>
        </div>

        {/* Category + Price */}
        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <AdminSelect
              value={formData.category}
              onChange={val => setFormData({ ...formData, category: val })}
              placeholder="Select Category"
              options={[
                { value: 'Family',       label: 'Family' },
                { value: 'Education',    label: 'Education' },
                { value: 'Special',      label: 'Special' },
                { value: 'Seasonal',     label: 'Seasonal' },
                { value: 'Members Only', label: 'Members Only' },
              ]}
            />
          </div>
          <div className="form-group">
            <label>Price ($)</label>
            <input type="number" min="0" step="0.01" placeholder="0.00 for free" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
          </div>
        </div>

        {/* Capacity */}
        <div className="form-group">
          <label>Max Capacity</label>
          <input type="number" min="0" placeholder="0" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} required />
        </div>

        {/* Featured — same pattern as Endangered */}
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <input
            type="checkbox"
            id="isFeatured"
            checked={formData.isFeatured}
            onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
            style={{ width: 16, height: 16, margin: 0, accentColor: '#f59e0b', flexShrink: 0 }}
          />
          <label htmlFor="isFeatured" style={{ margin: 0, cursor: 'pointer' }}>
            Mark as <span style={{ color: '#f59e0b', fontWeight: 700 }}>Featured</span>
          </label>
        </div>

        {/* Event Image */}
        <div className="form-group">
          <label>Event Image</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
            {previewUrl ? (
              <img src={previewUrl} alt="Preview"
                style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1.5px solid var(--adm-border)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--adm-bg-surface-2)', border: '1px dashed var(--adm-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ImageIcon size={22} style={{ color: 'var(--adm-text-muted)' }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <input type="file" accept="image/*"
                onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setImageFile(file);
                  if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(URL.createObjectURL(file));
                }}
                style={{ display: 'block', width: '100%' }} />
              <small className="text-secondary" style={{ marginTop: 4, display: 'block' }}>If no image is provided, an emoji placeholder will be used.</small>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Describe what attendees can expect..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            style={{ resize: 'vertical', minHeight: 80 }}
          />
        </div>
      </AdminModalForm>
    </div>
  );
};

export default ManageEvents;
