import React, { useState, useEffect, useMemo } from 'react';
import '../AdminTable.css';
import { MessageSquare, Plus, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { toast } from 'sonner';
import AdminModalForm from '../AdminModalForm';
import feedbackService from '../../../services/feedbackService';

const renderStars = (rating) => (
  <span style={{ color: '#f59e0b', letterSpacing: '1px', fontSize: '1rem' }}>
    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
  </span>
);

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

const GuestFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [filterRating, setFilterRating] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [formData, setFormData] = useState({
    rating: 5, comment: '', location: '',
    date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await feedbackService.getAllFeedback();
      setFeedbackList(data);
    } catch (err) {
      console.error('Failed to load feedback:', err);
      toast.error(err.message || 'Failed to load feedback.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredFeedback = useMemo(() => feedbackList.filter(f => {
    if (filterRating === 'All') return true;
    if (filterRating === '5') return f.rating === 5;
    if (filterRating === '4') return f.rating === 4;
    return f.rating <= 3;
  }), [feedbackList, filterRating]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this feedback record?')) {
      try {
        await feedbackService.deleteFeedback(id);
        setFeedbackList(prev => prev.filter(f => f.id !== id));
        toast.success('Feedback deleted.');
      } catch (err) {
        toast.error(err.message || 'Failed to delete feedback.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await feedbackService.createFeedback(formData);
      await loadData();
      setIsModalOpen(false);
      toast.success('Feedback added successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to save feedback.');
    }
  };

  const averageRating = feedbackList.length > 0
    ? (feedbackList.reduce((acc, f) => acc + f.rating, 0) / feedbackList.length).toFixed(1)
    : '0.0';

  const columns = useMemo(() => [
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: info => renderStars(info.getValue()),
    },
    {
      accessorKey: 'comment',
      header: 'Comment',
      cell: info => <span style={{ fontStyle: 'italic', color: 'var(--adm-text-primary)' }}>{info.getValue()}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: info => <span className="pill-badge outline">{info.getValue()}</span>,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: info => <span className="text-secondary">{info.getValue()}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="action-buttons">
          <button className="action-btn delete" onClick={() => handleDelete(row.original.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ], [feedbackList]);

  const table = useReactTable({
    data: filteredFeedback,
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
          <h1 className="admin-page-title">
            <MessageSquare className="title-icon" size={26} /> Guest Feedback
          </h1>
          <p className="admin-page-subtitle">Review survey results and comments from zoo visitors.</p>
        </div>
        <div className="admin-page-actions">
          <select
            className="admin-search-input"
            style={{ width: 'auto' }}
            value={filterRating}
            onChange={e => setFilterRating(e.target.value)}
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars & Below</option>
          </select>
          <button className="admin-btn-primary" onClick={() => { setFormData({ rating: 5, comment: '', location: '', date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] }); setIsModalOpen(true); }}>
            <Plus size={16} /> Add Feedback
          </button>
        </div>
      </div>

      {/* Mini Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--adm-bg-surface)', padding: '20px', borderRadius: 'var(--adm-radius-lg)', border: '1px solid var(--adm-border)', boxShadow: 'var(--adm-shadow-card)' }}>
          <p style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem', marginBottom: '6px', fontWeight: 500 }}>Total Responses</p>
          <h2 style={{ fontSize: '1.9rem', fontWeight: '900', color: 'var(--adm-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{feedbackList.length}</h2>
        </div>
        <div style={{ background: 'var(--adm-bg-surface)', padding: '20px', borderRadius: 'var(--adm-radius-lg)', border: '1px solid var(--adm-border)', boxShadow: 'var(--adm-shadow-card)' }}>
          <p style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem', marginBottom: '6px', fontWeight: 500 }}>Average Rating</p>
          <h2 style={{ fontSize: '1.9rem', fontWeight: '900', color: 'var(--adm-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {averageRating} <span style={{ fontSize: '1.4rem', color: '#f59e0b' }}>★</span>
          </h2>
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
                <div className="admin-table-loading">
                  <div className="admin-loading-spinner" />
                  <p>Loading feedback...</p>
                </div>
              </td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr className="no-hover"><td colSpan={columns.length}>
                <div className="admin-table-empty">
                  <div className="admin-table-empty-icon"><MessageSquare size={22} /></div>
                  <p className="admin-table-empty-title">No feedback found</p>
                  <p className="admin-table-empty-desc">Try adjusting the rating filter or add new feedback.</p>
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
                Page {pi + 1} of {pageCount} · {filteredFeedback.length} records
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

      <AdminModalForm title="Add Mock Feedback" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Rating (1–5)</label>
            <input type="number" min="1" max="5" value={formData.rating} onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })} required />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
          </div>
        </div>
        <div className="form-group">
          <label>Location Tag</label>
          <input type="text" placeholder="e.g. African Savanna" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Comment</label>
          <textarea placeholder="Guest feedback comment..." value={formData.comment} onChange={e => setFormData({ ...formData, comment: e.target.value })} required />
        </div>
      </AdminModalForm>
    </div>
  );
};

export default GuestFeedback;
