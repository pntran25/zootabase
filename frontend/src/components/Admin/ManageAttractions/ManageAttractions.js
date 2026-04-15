import React, { useState, useEffect, useMemo } from 'react';
import '../AdminTable.css';
import { TicketCheck, Search, Plus, Edit2, Trash2, Image as ImageIcon, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { toast } from 'sonner';
import AdminModalForm from '../AdminModalForm';
import AdminSelect from '../AdminSelect';
import TimePickerInput from '../TimePickerInput';
import attractionService, { uploadAttractionImage } from '../../../services/attractionService';
import { API_BASE_URL } from '../../../services/apiClient';

const TYPES = ['Ride', 'Show', 'Experience', 'Encounter', 'Feeding', 'Play Area', 'Tour'];

const shiftTime = (timeStr, deltaHours) => {
  if (!timeStr) return timeStr;
  const [h, m] = timeStr.split(':').map(Number);
  const newH = Math.max(0, Math.min(23, h + deltaHours));
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const EMPTY_FORM = {
  name: '', type: 'Ride', location: '', description: '',
  hours: '', duration: '', ageGroup: '', price: 0, capacity: 0, active: true,
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

const ManageAttractions = () => {
  const [attractions, setAttractions] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await attractionService.getAllAttractions();
      setAttractions(data.map(item => ({ ...item, active: item.status === 'Open' })));
    } catch (err) {
      console.error('Failed to load attractions:', err);
      toast.error(err.message || 'Failed to load attractions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredAttractions = useMemo(() =>
    attractions.filter(attr => {
      const matchesSearch = attr.name.toLowerCase().includes(search.toLowerCase()) ||
        attr.type.toLowerCase().includes(search.toLowerCase());
      const matchesType = !filterType || attr.type === filterType;
      return matchesSearch && matchesType;
    }), [attractions, search, filterType]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleOpenModal = (attraction = null) => {
    if (attraction) {
      setEditingAttraction(attraction);
      setFormData({ ...EMPTY_FORM, ...attraction });
      setImageFile(null);
      setPreviewUrl(attraction.imageUrl ? (attraction.imageUrl?.startsWith('http') ? attraction.imageUrl : `${API_BASE_URL}${attraction.imageUrl}`) : null);
    } else {
      setEditingAttraction(null);
      setFormData(EMPTY_FORM);
      setImageFile(null);
      setPreviewUrl(null);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this attraction?')) {
      try {
        await attractionService.deleteAttraction(id);
        setAttractions(prev => prev.filter(a => a.id !== id));
        toast.success('Attraction deleted.');
      } catch (err) {
        toast.error(err.message || 'Failed to delete attraction.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hoursFrom && hoursTo && hoursFrom >= hoursTo) {
      toast.error('Opening time must be before closing time.');
      return;
    }
    try {
      const payload = { ...formData, status: formData.active ? 'Open' : 'Closed' };
      let savedId;
      if (editingAttraction) {
        await attractionService.updateAttraction(editingAttraction.id, payload);
        savedId = editingAttraction.id;
      } else {
        const result = await attractionService.createAttraction(payload);
        savedId = result.id;
      }
      if (imageFile && savedId) {
        await uploadAttractionImage(savedId, imageFile);
      }
      await loadData();
      setIsModalOpen(false);
      toast.success(editingAttraction ? 'Attraction updated.' : 'Attraction created.');
    } catch (err) {
      toast.error(err.message || 'Failed to save attraction.');
      console.error(err);
    }
  };

  // Parse "HH:MM–HH:MM" stored in hours field
  const hoursFrom = (formData.hours || '').split(/[–\-]/)[0]?.trim() || '';
  const hoursTo   = (formData.hours || '').split(/[–\-]/)[1]?.trim() || '';

  const columns = useMemo(() => [
    {
      id: 'image',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const a = row.original;
        return a.imageUrl ? (
          <img src={(a.imageUrl?.startsWith('http') ? a.imageUrl : `${API_BASE_URL}${a.imageUrl}`)} alt={a.name}
            style={{ width: 48, height: 48, minWidth: 48, borderRadius: 8, objectFit: 'cover', border: '1.5px solid var(--adm-border)', display: 'block' }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--adm-bg-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--adm-border)' }}>
            <ImageIcon size={18} style={{ color: 'var(--adm-text-muted)' }} />
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Attraction',
      size: 260,
      cell: ({ row }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="font-medium text-dark">{row.original.name}</span>
          <span className="text-secondary" style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {row.original.description || '—'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: info => (
        <span className="pill-badge outline" style={{ color: '#9a3412', borderColor: '#fdba74', backgroundColor: '#fff7ed' }}>
          {info.getValue()}
        </span>
      ),
    },
    {
      id: 'details',
      header: 'Location / Schedule',
      enableSorting: false,
      cell: ({ row }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span className="font-medium text-dark">{row.original.location || '—'}</span>
          <span className="text-secondary">
            {row.original.hours || '—'} &bull; {row.original.duration ? `${row.original.duration} min` : '—'} &bull; {row.original.ageGroup || 'All Ages'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: info => {
        const p = Number(info.getValue() || 0);
        return p === 0
          ? <span className="pill-badge outline" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>Free</span>
          : <span className="font-medium" style={{ color: '#b45309' }}>${p.toFixed(2)}</span>;
      },
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: info => (
        <span className="pill-badge outline"
          style={info.getValue()
            ? { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }
            : { background: 'var(--adm-bg-surface-2)', color: 'var(--adm-text-muted)' }}>
          {info.getValue() ? 'Open' : 'Closed'}
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
  ], [attractions]);

  const table = useReactTable({
    data: filteredAttractions,
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
          <h1 className="admin-page-title"><TicketCheck className="title-icon" size={26} /> Manage Attractions</h1>
          <p className="admin-page-subtitle">Configure rides, shows, and experiences.</p>
        </div>
        <div className="admin-page-actions">
          <div className="admin-search-container">
            <Search className="search-icon" size={16} />
            <input type="text" placeholder="Search attractions..." className="admin-search-input" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--adm-border)', background: 'var(--adm-bg-surface)', color: 'var(--adm-text-primary)', fontSize: '0.82rem', cursor: 'pointer', minWidth: 120 }}
          >
            <option value="">All Types</option>
            {TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add Attraction
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
                      data-sorted={header.column.getIsSorted() || undefined}
                      style={header.column.columnDef.size ? { maxWidth: header.column.getSize() } : undefined}>
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
                <div className="admin-table-loading"><div className="admin-loading-spinner" /><p>Loading attractions...</p></div>
              </td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr className="no-hover"><td colSpan={columns.length}>
                <div className="admin-table-empty">
                  <div className="admin-table-empty-icon"><TicketCheck size={22} /></div>
                  <p className="admin-table-empty-title">No attractions found</p>
                  <p className="admin-table-empty-desc">
                    {search ? 'Try adjusting your search.' : 'Add your first attraction to get started.'}
                  </p>
                </div>
              </td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} style={{ opacity: row.original.active ? 1 : 0.65 }}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} style={{
                    ...(cell.column.columnDef.size ? { maxWidth: cell.column.getSize() } : {}),
                    ...(cell.column.id === 'image' ? { paddingRight: 6, width: 60, minWidth: 60 } : {}),
                  }}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!isLoading && table.getPageCount() > 1 && (
          <div className="admin-table-pagination">
            <span className="admin-pagination-info">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} · {filteredAttractions.length} records</span>
            <div className="admin-pagination-controls">
              <button className="admin-pagination-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>←</button>
              <button className="admin-pagination-btn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>→</button>
            </div>
          </div>
        )}
      </div>

      <AdminModalForm
        title={editingAttraction ? 'Edit Attraction' : 'Add New Attraction'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        {/* Name + Type */}
        <div className="form-row">
          <div className="form-group">
            <label>Attraction Name</label>
            <input type="text" placeholder="e.g. Jungle Train" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Type</label>
            <AdminSelect
              value={formData.type}
              onChange={val => setFormData({ ...formData, type: val })}
              options={TYPES.map(t => ({ value: t, label: t }))}
              placeholder="Select type..."
            />
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Brief description shown on the public page..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            style={{ minHeight: 72 }}
          />
        </div>

        {/* Location */}
        <div className="form-group">
          <label>Location</label>
          <input type="text" placeholder="e.g. East Gate, Zone B" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required />
        </div>

        {/* Hours */}
        <div className="form-row">
          <div className="form-group">
            <label>Opens At</label>
            <TimePickerInput
              value={hoursFrom}
              onChange={val => {
                const close = hoursTo || '17:00';
                const newClose = val >= close ? shiftTime(val, 1) : close;
                setFormData({ ...formData, hours: `${val}–${newClose}` });
              }}
              placeholder="Opening time"
            />
          </div>
          <div className="form-group">
            <label>Closes At</label>
            <TimePickerInput
              value={hoursTo}
              onChange={val => {
                const open = hoursFrom || '09:00';
                const newOpen = val <= open ? shiftTime(val, -1) : open;
                setFormData({ ...formData, hours: `${newOpen}–${val}` });
              }}
              placeholder="Closing time"
            />
          </div>
        </div>

        {/* Duration (minutes) + Age Group */}
        <div className="form-row">
          <div className="form-group">
            <label>Duration (minutes)</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 20"
              value={formData.duration}
              onChange={e => setFormData({ ...formData, duration: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Age Group</label>
            <input type="text" placeholder="e.g. All Ages, Ages 3+" value={formData.ageGroup} onChange={e => setFormData({ ...formData, ageGroup: e.target.value })} />
          </div>
        </div>

        {/* Price */}
        <div className="form-group">
          <label>Price ($) — enter 0 for free</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
          />
        </div>

        {/* Image upload */}
        <div className="form-group">
          <label>Attraction Image</label>
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
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'block', width: '100%' }} />
              <small className="text-secondary" style={{ marginTop: 4, display: 'block' }}>If no image is provided, a coloured placeholder will be shown.</small>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="form-group checkbox-group">
          <input type="checkbox" id="active-flag" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} />
          <label htmlFor="active-flag">Open to Public</label>
        </div>
      </AdminModalForm>
    </div>
  );
};

export default ManageAttractions;
