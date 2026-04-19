import React, { useState, useEffect, useMemo } from 'react';
import '../AdminTable.css';
import { Map, Search, Plus, Edit2, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Star, Image as ImageIcon } from 'lucide-react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { toast } from 'sonner';
import AdminModalForm from '../AdminModalForm';
import AdminSelect from '../AdminSelect';
import TimePickerInput from '../TimePickerInput';
import { getExhibits, createExhibit, updateExhibit, deleteExhibit, uploadExhibitImage, setExhibitFeatured } from '../../../services/exhibitService';
import { API_BASE_URL } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';

const to12hr = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};
const formatHours = (s) => {
  if (!s) return '';
  const [a, b] = s.split(/[–\-]/);
  return b ? `${to12hr(a.trim())} – ${to12hr(b.trim())}` : s;
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

const ManageExhibits = () => {
  const [exhibits, setExhibits] = useState([]);
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterHabitat, setFilterHabitat] = useState('');
  const [filterFeatured, setFilterFeatured] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExhibit, setEditingExhibit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [formData, setFormData] = useState({
    name: '', area: '', habitat: '', capacity: 0, openingHours: '', description: '', isFeatured: false
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const { userProfile } = useAuth();
  const canEdit = ['Super Admin', 'Zoo Manager'].includes(userProfile?.Role);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getExhibits();
      const mapped = data.map(item => ({
        id: item.ExhibitID,
        name: item.ExhibitName,
        area: item.AreaName || '',
        habitat: item.HabitatType || '',
        capacity: item.Capacity,
        openingHours: item.OpeningHours,
        description: item.Description || '',
        isFeatured: item.IsFeatured === true || item.IsFeatured === 1,
        imageUrl: item.ImageUrl || null,
        createdBy: item.CreatedBy || null,
        updatedBy: item.UpdatedBy || null,
      }));
      setExhibits(mapped);
    } catch (err) {
      console.error('Failed to load exhibits:', err);
      toast.error(err.message || 'Failed to load exhibits.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const areas = useMemo(() => [...new Set(exhibits.map(e => e.area).filter(Boolean))].sort(), [exhibits]);
  const habitats = useMemo(() => [...new Set(exhibits.map(e => e.habitat).filter(Boolean))].sort(), [exhibits]);

  const filteredExhibits = useMemo(() =>
    exhibits.filter(exhibit => {
      const matchesSearch = exhibit.name.toLowerCase().includes(search.toLowerCase()) ||
        exhibit.area.toLowerCase().includes(search.toLowerCase());
      const matchesArea = !filterArea || exhibit.area === filterArea;
      const matchesHabitat = !filterHabitat || exhibit.habitat === filterHabitat;
      const matchesFeatured = filterFeatured === '' || (filterFeatured === 'yes' ? exhibit.isFeatured : !exhibit.isFeatured);
      return matchesSearch && matchesArea && matchesHabitat && matchesFeatured;
    }), [exhibits, search, filterArea, filterHabitat, filterFeatured]);

  const handleOpenModal = (exhibit = null) => {
    if (exhibit) {
      setEditingExhibit(exhibit);
      setFormData({ ...exhibit, description: exhibit.description || '', isFeatured: exhibit.isFeatured === true || exhibit.isFeatured === 1 });
      setPreviewUrl(exhibit.imageUrl ? (exhibit.imageUrl?.startsWith('http') ? exhibit.imageUrl : `${API_BASE_URL}${exhibit.imageUrl}`) : null);
      setImageFile(null);
    } else {
      setEditingExhibit(null);
      setFormData({ name: '', area: '', habitat: '', capacity: 0, openingHours: '', description: '', isFeatured: false });
      setPreviewUrl(null);
      setImageFile(null);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exhibit?')) {
      try {
        await deleteExhibit(id);
        setExhibits(prev => prev.filter(e => e.id !== id));
        toast.success('Exhibit deleted.');
      } catch (err) {
        toast.error(err.message || 'Failed to delete exhibit.');
      }
    }
  };

  const handleToggleFeatured = async (exhibit) => {
    try {
      await setExhibitFeatured(exhibit.id, !exhibit.isFeatured);
      await loadData();
      toast.success(exhibit.isFeatured ? 'Removed from featured.' : 'Marked as featured.');
    } catch (err) {
      toast.error(err.message || 'Failed to update featured status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hoursParts = (formData.openingHours || '').split(/[–\-]/);
    const openFrom = hoursParts[0]?.trim() || '';
    const openTo = hoursParts[1]?.trim() || '';
    if (openFrom && openTo && openFrom >= openTo) {
      toast.error('Opening time must be before closing time.');
      return;
    }
    const payload = {
      ExhibitName: formData.name,
      AreaName: formData.area,
      HabitatType: formData.habitat,
      Capacity: formData.capacity,
      OpeningHours: formData.openingHours,
      Description: formData.description || null,
    };
    try {
      let savedExhibitId = null;
      if (editingExhibit) {
        await updateExhibit(editingExhibit.id, payload);
        savedExhibitId = editingExhibit.id;
      } else {
        const result = await createExhibit(payload);
        savedExhibitId = result.ExhibitID;
      }
      await setExhibitFeatured(savedExhibitId, formData.isFeatured);
      if (imageFile && savedExhibitId) {
        await uploadExhibitImage(savedExhibitId, imageFile);
      }
      await loadData();
      setIsModalOpen(false);
      toast.success(editingExhibit ? 'Exhibit updated.' : 'Exhibit created.');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save exhibit.');
    }
  };

  const columns = useMemo(() => [
    {
      id: 'image',
      header: '',
      enableSorting: false,
      cell: ({ row }) => row.original.imageUrl ? (
        <img src={(row.original.imageUrl?.startsWith('http') ? row.original.imageUrl : `${API_BASE_URL}${row.original.imageUrl}`)} alt={row.original.name}
          style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1.5px solid var(--adm-border)', display: 'block' }} />
      ) : (
        <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--adm-bg-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--adm-border)' }}>
          <ImageIcon size={18} style={{ color: 'var(--adm-text-muted)' }} />
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Exhibit Name',
      cell: info => <span className="font-medium text-dark">{info.getValue()}</span>,
    },
    {
      id: 'themeHabitat',
      header: 'Theme / Habitat',
      enableSorting: false,
      cell: ({ row }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="font-medium text-dark">{row.original.area}</span>
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{row.original.habitat}</span>
        </div>
      ),
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
      cell: info => (
        <span className="text-secondary">{info.getValue()} visitors</span>
      ),
    },
    {
      accessorKey: 'openingHours',
      header: 'Opening Hours',
      cell: info => <span className="text-secondary">{formatHours(info.getValue())}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'isFeatured',
      header: 'Featured',
      sortingFn: (a, b) => {
        const aV = a.original.isFeatured ? 1 : 0;
        const bV = b.original.isFeatured ? 1 : 0;
        return aV - bV;
      },
      cell: ({ row }) => (
        canEdit ? (
          <button
            onClick={() => handleToggleFeatured(row.original)}
            title={row.original.isFeatured ? 'Remove from featured' : 'Mark as featured'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: row.original.isFeatured ? '#f59e0b' : 'var(--adm-text-muted)',
              transition: 'color 0.15s, transform 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.8rem', fontWeight: 600,
            }}
          >
            <Star size={16} fill={row.original.isFeatured ? 'currentColor' : 'none'} />
            {row.original.isFeatured ? 'Featured' : ''}
          </button>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: row.original.isFeatured ? '#f59e0b' : 'var(--adm-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <Star size={16} fill={row.original.isFeatured ? 'currentColor' : 'none'} />
            {row.original.isFeatured ? 'Featured' : ''}
          </span>
        )
      ),
    },
    {
      id: 'modifiedBy',
      header: 'Modified By',
      enableSorting: false,
      size: 160,
      cell: ({ row }) => {
        const { createdBy, updatedBy } = row.original;
        if (updatedBy) return <span className="text-secondary" style={{ fontSize: '0.78rem', display: 'block', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Updated by <strong>{updatedBy}</strong></span>;
        if (createdBy) return <span className="text-secondary" style={{ fontSize: '0.78rem', display: 'block', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Created by <strong>{createdBy}</strong></span>;
        return <span className="text-secondary">—</span>;
      },
    },
    ...(canEdit ? [{
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="action-buttons" style={{ whiteSpace: 'nowrap' }}>
          <button className="action-btn edit" onClick={() => handleOpenModal(row.original)}><Edit2 size={16} /></button>
          <button className="action-btn delete" onClick={() => handleDelete(row.original.id)}><Trash2 size={16} /></button>
        </div>
      ),
    }] : []),
  ], [exhibits]);

  const table = useReactTable({
    data: filteredExhibits,
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
          <h1 className="admin-page-title"><Map className="title-icon" size={26} /> Manage Exhibits</h1>
          <p className="admin-page-subtitle">Configure animal habitats and zoo areas.</p>
        </div>
        <div className="admin-page-actions">
          <div className="admin-search-container">
            <Search className="search-icon" size={16} />
            <input type="text" placeholder="Search exhibits..." className="admin-search-input" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {canEdit && (
            <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={16} /> Add Exhibit
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap', padding: '10px 14px', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Area</span>
          <AdminSelect value={filterArea} onChange={setFilterArea} width="140px" options={[{ value: '', label: 'All Areas' }, ...areas.map(a => ({ value: a, label: a }))]} />
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Habitat</span>
          <AdminSelect value={filterHabitat} onChange={setFilterHabitat} width="140px" options={[{ value: '', label: 'All Habitats' }, ...habitats.map(h => ({ value: h, label: h }))]} />
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--adm-border)', margin: '0 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Featured</span>
          {[{ val: '', label: 'All' }, { val: 'yes', label: 'Featured' }, { val: 'no', label: 'Standard' }].map(f => (
            <button key={f.val || 'all'} onClick={() => setFilterFeatured(f.val)}
              style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${filterFeatured === f.val ? 'var(--adm-accent)' : 'var(--adm-border)'}`, background: filterFeatured === f.val ? 'var(--adm-accent-dim, rgba(34,107,64,0.1))' : 'transparent', color: filterFeatured === f.val ? 'var(--adm-accent)' : 'var(--adm-text-secondary)', transition: 'all 0.15s' }}>
              {f.label}
            </button>
          ))}
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
                <div className="admin-table-loading"><div className="admin-loading-spinner" /><p>Loading exhibits...</p></div>
              </td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr className="no-hover"><td colSpan={columns.length}>
                <div className="admin-table-empty">
                  <div className="admin-table-empty-icon"><Map size={22} /></div>
                  <p className="admin-table-empty-title">No exhibits found</p>
                  <p className="admin-table-empty-desc">
                    {search ? 'Try adjusting your search.' : 'Add your first exhibit to get started.'}
                  </p>
                </div>
              </td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} style={cell.column.id === 'image' ? { paddingRight: 6 } : undefined}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!isLoading && table.getPageCount() > 1 && (() => {
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
                Page {pi + 1} of {pageCount} · {filteredExhibits.length} records
              </span>
              <div className="admin-pagination-controls">
                <button className="admin-pagination-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  <ChevronLeft size={14} />
                </button>
                {pages.map((p, idx) => (
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} style={{ padding: '0 8px', color: 'var(--adm-text-secondary)' }}>...</span>
                  ) : (
                    <button key={p} className={`admin-pagination-btn${pi === p ? ' active' : ''}`} onClick={() => table.setPageIndex(p)}>
                      {p + 1}
                    </button>
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

      <AdminModalForm title={editingExhibit ? 'Edit Exhibit' : 'Add New Exhibit'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Exhibit Name</label>
            <input type="text" placeholder="e.g. African Savanna" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Area Designation</label>
            <input type="text" placeholder="e.g. Africa" value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })} required />
          </div>
        </div>
        <div className="form-group">
          <label>Habitat Type</label>
          <input type="text" placeholder="e.g. Grassland, Aquatic" value={formData.habitat} onChange={e => setFormData({ ...formData, habitat: e.target.value })} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Max Capacity (Visitors)</label>
            <input type="number" min="0" placeholder="0" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} required />
          </div>
        </div>
        <div className="form-row">
          {(() => {
            const parts = (formData.openingHours || '').split(/[–\-]/);
            const openFrom = parts[0]?.trim() || '';
            const openTo = parts[1]?.trim() || '';
            return (
              <>
                <div className="form-group">
                  <label>Opens At</label>
                  <TimePickerInput
                    value={openFrom}
                    onChange={val => {
                      const close = openTo || '17:00';
                      const newClose = val >= close ? shiftTime(val, 1) : close;
                      setFormData({ ...formData, openingHours: `${val}–${newClose}` });
                    }}
                    placeholder="Opening time"
                  />
                </div>
                <div className="form-group">
                  <label>Closes At</label>
                  <TimePickerInput
                    value={openTo}
                    onChange={val => {
                      const open = openFrom || '09:00';
                      const newOpen = val <= open ? shiftTime(val, -1) : open;
                      setFormData({ ...formData, openingHours: `${newOpen}–${val}` });
                    }}
                    placeholder="Closing time"
                  />
                </div>
              </>
            );
          })()}
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Describe this exhibit for visitors..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            style={{ resize: 'vertical', minHeight: 80 }}
          />
        </div>
        <div className="form-group">
          <label>Exhibit Image</label>
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
              <input type="file" accept="image/*" onChange={e => {
                const file = e.target.files[0];
                if (!file) return;
                setImageFile(file);
                if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(URL.createObjectURL(file));
              }} style={{ display: 'block', width: '100%' }} />
              <small className="text-secondary" style={{ marginTop: 4, display: 'block' }}>If no image is provided, a placeholder will be used.</small>
            </div>
          </div>
        </div>
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <input
            type="checkbox"
            id="isFeatured"
            checked={formData.isFeatured}
            onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
            style={{ width: 16, height: 16, margin: 0, accentColor: '#f59e0b', flexShrink: 0 }}
          />
          <label htmlFor="isFeatured" style={{ margin: 0, cursor: 'pointer' }}>
            Feature on <span style={{ color: '#f59e0b', fontWeight: 700 }}>Home Page</span>
          </label>
        </div>
      </AdminModalForm>
    </div>
  );
};

export default ManageExhibits;
