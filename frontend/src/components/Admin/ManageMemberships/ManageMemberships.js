import { useState, useEffect, useMemo } from 'react';
import '../AdminTable.css';
import AdminModalForm from '../AdminModalForm';
import {
  CreditCard, Search, Plus, Edit2, Trash2,
  ChevronUp, ChevronDown, ChevronsUpDown, Star, X,
} from 'lucide-react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getPaginationRowModel, flexRender,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../services/apiClient';

const EMPTY_FORM = {
  name: '', description: '',
  monthlyPrice: '', yearlyPrice: '',
  isPopular: false, sortOrder: '',
  features: [{ text: '', included: true }],
};

const SortIcon = ({ column }) => {
  if (!column.getCanSort()) return null;
  const dir = column.getIsSorted();
  if (dir === 'asc')  return <ChevronUp size={13} className="sort-icon" />;
  if (dir === 'desc') return <ChevronDown size={13} className="sort-icon" />;
  return <ChevronsUpDown size={13} className="sort-icon" />;
};

const ManageMemberships = () => {
  const [plans, setPlans]           = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [search, setSearch]         = useState('');
  const [sorting, setSorting]       = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData]     = useState(EMPTY_FORM);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/membership-plans');
      setPlans(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredPlans = useMemo(() =>
    plans.filter(p =>
      p.Name?.toLowerCase().includes(search.toLowerCase()) ||
      p.Description?.toLowerCase().includes(search.toLowerCase())
    ), [plans, search]);

  const handleOpenModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.Name,
        description: plan.Description || '',
        monthlyPrice: plan.MonthlyPrice,
        yearlyPrice: plan.YearlyPrice,
        isPopular: !!plan.IsPopular,
        sortOrder: plan.SortOrder,
        features: plan.Features?.length ? plan.Features : [{ text: '', included: true }],
      });
    } else {
      setEditingPlan(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const handleFeatureChange = (idx, field, value) =>
    setFormData(prev => {
      const features = [...prev.features];
      features[idx] = { ...features[idx], [field]: value };
      return { ...prev, features };
    });

  const addFeature = () =>
    setFormData(prev => ({ ...prev, features: [...prev.features, { text: '', included: true }] }));

  const removeFeature = (idx) =>
    setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Plan name is required.'); return; }
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      monthlyPrice: parseFloat(formData.monthlyPrice) || 0,
      yearlyPrice: parseFloat(formData.yearlyPrice) || 0,
      isPopular: formData.isPopular,
      sortOrder: parseInt(formData.sortOrder) || 0,
      features: formData.features.filter(f => f.text.trim()),
    };
    try {
      if (editingPlan) {
        await apiPut(`/api/membership-plans/${editingPlan.PlanID}`, payload);
        toast.success('Plan updated.');
      } else {
        await apiPost('/api/membership-plans', payload);
        toast.success('Plan created.');
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Delete "${plan.Name}"? This will remove it from the public page.`)) return;
    try {
      await apiDelete(`/api/membership-plans/${plan.PlanID}`);
      setPlans(prev => prev.filter(p => p.PlanID !== plan.PlanID));
      toast.success('Plan deleted.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'SortOrder', header: '#', size: 50,
      cell: info => <span className="text-secondary">{info.getValue()}</span>,
    },
    {
      accessorKey: 'Name', header: 'Plan Name',
      cell: info => <span className="font-medium">{info.getValue()}</span>,
    },
    {
      accessorKey: 'Description', header: 'Description',
      cell: info => <span className="text-secondary">{info.getValue() || '—'}</span>,
    },
    {
      accessorKey: 'MonthlyPrice', header: 'Monthly',
      cell: info => <span>${Number(info.getValue()).toFixed(2)}/mo</span>,
    },
    {
      accessorKey: 'YearlyPrice', header: 'Yearly',
      cell: info => <span>${Number(info.getValue()).toFixed(0)}/yr</span>,
    },
    {
      accessorKey: 'IsPopular', header: 'Popular', size: 90,
      cell: info => info.getValue()
        ? <Star size={15} fill="#f59e0b" stroke="#f59e0b" />
        : <span className="text-secondary">—</span>,
    },
    {
      accessorKey: 'Features', header: 'Features', size: 90,
      cell: info => {
        const f = info.getValue() || [];
        return <span className="text-secondary">{f.length} items</span>;
      },
    },
    {
      id: 'actions', header: 'Actions', size: 110, enableSorting: false,
      cell: info => (
        <div className="action-buttons">
          <button className="action-btn edit" title="Edit" onClick={() => handleOpenModal(info.row.original)}>
            <Edit2 size={15} />
          </button>
          <button className="action-btn delete" title="Delete" onClick={() => handleDelete(info.row.original)}>
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: filteredPlans, columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="admin-page">
      {/* ── Header ── */}
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title">
            <CreditCard className="title-icon" size={24} /> Manage Membership Plans
          </h1>
          <p className="admin-page-subtitle">{plans.length} plan{plans.length !== 1 ? 's' : ''} · Control what's shown on the public membership page</p>
        </div>
        <div className="admin-page-actions">
          <div className="admin-search-container">
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search plans..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={15} /> New Plan
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                    data-sorted={header.column.getIsSorted() || undefined}
                  >
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
                <div className="admin-table-loading">
                  <div className="admin-loading-spinner" />
                  <p>Loading plans...</p>
                </div>
              </td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr className="no-hover"><td colSpan={columns.length}>
                <div className="admin-table-empty">
                  <div className="admin-table-empty-icon"><CreditCard size={22} /></div>
                  <p className="admin-table-empty-title">No plans found</p>
                  <p className="admin-table-empty-desc">
                    {search ? 'Try adjusting your search.' : 'Click "New Plan" to create your first membership plan.'}
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
            <span className="admin-pagination-info">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} · {filteredPlans.length} records
            </span>
            <div className="admin-pagination-controls">
              <button className="admin-pagination-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>←</button>
              <button className="admin-pagination-btn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>→</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      <AdminModalForm
        title={editingPlan ? 'Edit Plan' : 'New Membership Plan'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Plan Name <span style={{ color: 'var(--adm-accent)' }}>*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Family"
              required
            />
          </div>
          <div className="form-group" style={{ flex: '0 0 110px' }}>
            <label>Sort Order</label>
            <input
              type="number"
              min="0"
              value={formData.sortOrder}
              onChange={e => setFormData(p => ({ ...p, sortOrder: e.target.value }))}
              placeholder="1"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            placeholder="e.g. Best value for families"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Monthly Price ($)</label>
            <input
              type="number" min="0" step="0.01"
              value={formData.monthlyPrice}
              onChange={e => setFormData(p => ({ ...p, monthlyPrice: e.target.value }))}
              placeholder="19.99"
            />
          </div>
          <div className="form-group">
            <label>Yearly Price ($)</label>
            <input
              type="number" min="0" step="0.01"
              value={formData.yearlyPrice}
              onChange={e => setFormData(p => ({ ...p, yearlyPrice: e.target.value }))}
              placeholder="179.00"
            />
          </div>
        </div>

        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="isPopular"
            checked={formData.isPopular}
            onChange={e => setFormData(p => ({ ...p, isPopular: e.target.checked }))}
          />
          <label htmlFor="isPopular" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Star size={14} fill={formData.isPopular ? '#f59e0b' : 'none'} stroke="#f59e0b" />
            Mark as Most Popular
          </label>
        </div>

        {/* Features */}
        <p className="form-section-heading">Features</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {formData.features.map((f, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={f.text}
                onChange={e => handleFeatureChange(idx, 'text', e.target.value)}
                placeholder={`Feature ${idx + 1}`}
                style={{
                  flex: 1, padding: '8px 12px',
                  border: '1px solid var(--adm-border)',
                  borderRadius: 'var(--adm-radius-md)',
                  fontSize: '0.875rem',
                  color: 'var(--adm-text-primary)',
                  background: 'var(--adm-bg-surface-2)',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: 600, color: 'var(--adm-text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={f.included}
                  onChange={e => handleFeatureChange(idx, 'included', e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: 'var(--adm-accent)' }}
                />
                Included
              </label>
              <button
                type="button"
                onClick={() => removeFeature(idx)}
                className="action-btn delete"
                title="Remove feature"
                style={{ opacity: 1 }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addFeature}
          style={{
            marginTop: 10, fontSize: '0.82rem',
            color: 'var(--adm-accent)', background: 'none',
            border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600,
          }}
        >
          + Add Feature
        </button>
      </AdminModalForm>
    </div>
  );
};

export default ManageMemberships;
