import React, { useState, useEffect, useMemo } from 'react';
import '../AdminTable.css';
import { Ticket, Plus, Edit2, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { toast } from 'sonner';
import AdminModalForm from '../AdminModalForm';
import ticketService from '../../../services/ticketService';

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

const ManageTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [formData, setFormData] = useState({ type: '', category: 'General', desc: '', price: 0 });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await ticketService.getAllTickets();
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      toast.error(err.message || 'Failed to load tickets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenModal = (ticket = null) => {
    if (ticket) { setEditingTicket(ticket); setFormData({ ...ticket }); }
    else { setEditingTicket(null); setFormData({ type: '', category: 'General', desc: '', price: 0 }); }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ticket type?')) {
      try {
        await ticketService.deleteTicket(id);
        setTickets(prev => prev.filter(t => t.id !== id));
        toast.success('Ticket type deleted.');
      } catch (err) {
        toast.error(err.message || 'Failed to delete ticket.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTicket) {
        await ticketService.updateTicket(editingTicket.id, formData);
        toast.success('Ticket type updated.');
      } else {
        await ticketService.createTicket(formData);
        toast.success('Ticket type created.');
      }
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save ticket type.');
      console.error(err);
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'type',
      header: 'Ticket Name',
      cell: info => <span className="font-medium text-dark">{info.getValue()}</span>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: info => {
        const cat = info.getValue();
        return (
          <span className="pill-badge outline"
            style={cat === 'VIP' ? { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' } : {}}>
            {cat}
          </span>
        );
      },
    },
    {
      accessorKey: 'desc',
      header: 'Description',
      cell: info => <span className="text-secondary">{info.getValue()}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: info => <span className="font-medium text-dark" style={{ display: 'block', textAlign: 'right' }}>${Number(info.getValue() || 0).toFixed(2)}</span>,
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
  ], [tickets]);

  const table = useReactTable({
    data: tickets,
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
          <h1 className="admin-page-title"><Ticket className="title-icon" size={26} /> Manage Tickets</h1>
          <p className="admin-page-subtitle">Configure ticket pricing and categories.</p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add Ticket Type
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
                      style={header.id === 'price' ? { textAlign: 'right' } : {}}>
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
                <div className="admin-table-loading"><div className="admin-loading-spinner" /><p>Loading tickets...</p></div>
              </td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr className="no-hover"><td colSpan={columns.length}>
                <div className="admin-table-empty">
                  <div className="admin-table-empty-icon"><Ticket size={22} /></div>
                  <p className="admin-table-empty-title">No tickets configured</p>
                  <p className="admin-table-empty-desc">Add your first ticket type to get started.</p>
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
            <span className="admin-pagination-info">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} · {tickets.length} records</span>
            <div className="admin-pagination-controls">
              <button className="admin-pagination-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>←</button>
              <button className="admin-pagination-btn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>→</button>
            </div>
          </div>
        )}
      </div>

      <AdminModalForm title={editingTicket ? 'Edit Ticket Type' : 'Add New Ticket'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Ticket Name</label>
            <input type="text" placeholder="e.g. Adult Admission" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
              <option value="General">General</option>
              <option value="Child">Child</option>
              <option value="VIP">VIP</option>
              <option value="Event">Event</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <input type="text" placeholder="e.g. Single day access for guests 13–64" value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Price ($)</label>
          <input type="number" min="0" step="0.01" placeholder="0.00" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required />
        </div>
      </AdminModalForm>
    </div>
  );
};

export default ManageTickets;
