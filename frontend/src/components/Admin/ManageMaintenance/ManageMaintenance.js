import React, { useState, useEffect, useMemo } from 'react';
import '../AdminTable.css';
import '../AnimalHealth/HealthReport.css';
import { Wrench, Search, Plus, CheckCircle, Edit2, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { toast } from 'sonner';
import AdminModalForm from '../AdminModalForm';
import DatePickerInput from '../DatePickerInput';
import AdminSelect from '../AdminSelect';
import maintenanceService from '../../../services/maintenanceService';

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

const priorityStyle = (priority) => {
  if (priority === 'High' || priority === 'Critical') return { color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5' };
  if (priority === 'Medium') return { color: '#d97706', background: '#fef3c7', border: '1px solid #fde68a' };
  return { color: '#059669', background: '#d1fae5', border: '1px solid #6ee7b7' };
};

const statusStyle = (status) => {
  if (status === 'Completed') return { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
  if (status === 'In Progress') return { background: '#fef9c3', color: '#854d0e', border: '1px solid #fef08a' };
  return { background: 'var(--adm-bg-surface-2)', color: 'var(--adm-text-secondary)', border: '1px solid var(--adm-border)' };
};

const statusDotColor = (status) => {
  if (status === 'Completed') return '#22c55e';
  if (status === 'In Progress') return '#eab308';
  return '#94a3b8';
};

const ManageMaintenance = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [formData, setFormData] = useState({
    issueType: '', location: '', status: 'Pending',
    date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0], priority: 'Medium'
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await maintenanceService.getAllMaintenance();
      const mapped = data.map(log => ({
        id: log.id,
        issueType: log.description,
        location: log.exhibit,
        date: log.dateSubmitted,
        status: log.status,
        reportedBy: log.reportedBy,
        priority: 'Medium',
        createdBy: log.createdBy || null,
        updatedBy: log.updatedBy || null,
      }));
      setLogs(mapped);
    } catch (err) {
      console.error('Failed to load maintenance logs:', err);
      toast.error(err.message || 'Failed to load maintenance logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredLogs = useMemo(() =>
    logs.filter(log => {
      const matchesSearch =
        log.issueType.toLowerCase().includes(search.toLowerCase()) ||
        log.location.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'active' ? log.status !== 'Completed' :
        log.status === 'Completed';
      return matchesSearch && matchesStatus;
    }), [logs, search, statusFilter]);

  const handleOpenModal = (log = null) => {
    if (log) {
      setEditingLog(log);
      setFormData({ issueType: log.issueType, location: log.location, status: log.status, date: log.date, priority: log.priority });
    } else {
      setEditingLog(null);
      setFormData({ issueType: '', location: '', status: 'Pending', date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0], priority: 'Medium' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        await maintenanceService.deleteMaintenance(id);
        setLogs(prev => prev.filter(l => l.id !== id));
        toast.success('Maintenance record deleted.');
      } catch (err) {
        toast.error(err.message || 'Failed to delete maintenance record.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        exhibit: formData.location,
        description: formData.issueType,
        dateSubmitted: formData.date,
        status: formData.status,
        reportedBy: 'Admin User',
      };
      if (editingLog) {
        await maintenanceService.updateMaintenance(editingLog.id, payload);
        toast.success('Maintenance record updated.');
      } else {
        await maintenanceService.createMaintenance(payload);
        toast.success('Maintenance request created.');
      }
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save maintenance record.');
      console.error(err);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pending' ? 'In Progress' : currentStatus === 'In Progress' ? 'Completed' : 'Pending';
    const log = logs.find(l => l.id === id);
    if (!log) return;
    try {
      await maintenanceService.updateMaintenance(id, {
        exhibit: log.location,
        description: log.issueType,
        dateSubmitted: log.date,
        status: newStatus,
        reportedBy: log.reportedBy || 'Admin User',
      });
      setLogs(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
      toast.success(`Status updated to ${newStatus}.`);
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'issueType',
      header: 'Issue',
      cell: ({ row }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="font-medium text-dark">{row.original.issueType}</span>
          <span className="text-secondary" style={{ fontSize: '0.78rem' }}>Reported {row.original.date}</span>
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: info => <span className="pill-badge outline">{info.getValue()}</span>,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: info => (
        <span className="pill-badge outline" style={priorityStyle(info.getValue())}>{info.getValue()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => (
        <span className="pill-badge outline" style={statusStyle(info.getValue())}>
          <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: statusDotColor(info.getValue()), marginRight: 5 }} />
          {info.getValue()}
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
      header: () => <span style={{ paddingRight: 60 }}>Actions</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="action-buttons">
          {row.original.status !== 'Completed' && (
            <button
              className="action-btn"
              onClick={() => handleToggleStatus(row.original.id, row.original.status)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--adm-accent)', padding: '5px 10px', border: '1px solid var(--adm-accent)', borderRadius: 6 }}
            >
              <CheckCircle size={13} /> Advance
            </button>
          )}
          <button className="action-btn edit" onClick={() => handleOpenModal(row.original)}><Edit2 size={16} /></button>
          <button className="action-btn delete" onClick={() => handleDelete(row.original.id)}><Trash2 size={16} /></button>
        </div>
      ),
    },
  ], [logs]);

  const table = useReactTable({
    data: filteredLogs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const openCount = logs.filter(l => l.status !== 'Completed').length;

  return (
    <div className="admin-page">
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title"><Wrench className="title-icon" size={26} /> Maintenance Logs</h1>
          <p className="admin-page-subtitle">Track and manage park repair requests.</p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> New Request
          </button>
        </div>
      </div>

      {openCount > 0 && (
        <div className="admin-info-banner" style={{ borderColor: 'rgba(217,119,6,0.3)', background: 'rgba(217,119,6,0.08)' }}>
          <Wrench size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--adm-text-secondary)' }}>
            <strong style={{ color: '#d97706' }}>{openCount} open request{openCount !== 1 ? 's' : ''}</strong> require attention.
          </p>
        </div>
      )}

      {/* Search + status filter bar */}
      <div className="hr-toolbar">
        <div className="hr-search-wrap">
          <Search className="hr-search-icon" size={15} />
          <input
            type="text"
            placeholder="Search by issue or location..."
            className="hr-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="hr-filter-group">
          {['all', 'active', 'completed'].map(f => (
            <button
              key={f}
              className={`hr-filter-btn${statusFilter === f ? ' hr-filter-active' : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
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
              <tr><td colSpan={columns.length}>
                <div className="admin-table-loading"><div className="admin-loading-spinner" /><p>Loading maintenance logs...</p></div>
              </td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length}>
                <div className="admin-table-empty">
                  <div className="admin-table-empty-icon"><Wrench size={22} /></div>
                  <p className="admin-table-empty-title">No maintenance logs found</p>
                  <p className="admin-table-empty-desc">
                    {search || statusFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Log a new request to get started.'}
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
                Page {pi + 1} of {pageCount} · {filteredLogs.length} records
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

      <AdminModalForm title={editingLog ? 'Edit Maintenance Request' : 'New Maintenance Request'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Issue Description</label>
          <input type="text" placeholder="e.g. Broken turnstile at Entrance A" value={formData.issueType} onChange={e => setFormData({ ...formData, issueType: e.target.value })} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Location (Area / Exhibit)</label>
            <input type="text" placeholder="e.g. Main Entrance" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Reported Date</label>
            <DatePickerInput
              value={formData.date}
              onChange={val => setFormData({ ...formData, date: val })}
              placeholder="Select reported date"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Priority</label>
            <AdminSelect
              value={formData.priority}
              onChange={val => setFormData({ ...formData, priority: val })}
              options={['Low', 'Medium', 'High', 'Critical']}
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <AdminSelect
              value={formData.status}
              onChange={val => setFormData({ ...formData, status: val })}
              options={['Pending', 'In Progress', 'Completed', 'Cancelled']}
            />
          </div>
        </div>
      </AdminModalForm>
    </div>
  );
};

export default ManageMaintenance;
