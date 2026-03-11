import React, { useState } from 'react';
import '../AdminTable.css';
import { Ticket, Info, Plus, Edit2, Trash2 } from 'lucide-react';
import AdminModalForm from '../AdminModalForm';

// Mapping to TicketType Schema: TicketTypeID, TypeName (Enum: General | Child | VIP | Event)
// Plus a mock "Price" and "Description" field for UI purposes as needed by the prompt
const initialTickets = [
  { id: '1', type: 'General Admission - Adult', category: 'General', desc: 'Single day access for guests 13-64', price: 25.00 },
  { id: '2', type: 'General Admission - Child', category: 'Child', desc: 'Single day access for guests 3-12', price: 15.00 },
  { id: '3', type: 'VIP Early Access', category: 'VIP', desc: 'Includes early morning entry', price: 50.00 },
  { id: '4', type: 'Special Event Access', category: 'Event', desc: 'Entry for specific scheduled events', price: 35.00 },
];

const ManageTickets = () => {
  const [tickets, setTickets] = useState(initialTickets);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  
  // Form State aligned with TicketType Schema
  const [formData, setFormData] = useState({
    type: '',
    category: 'General', // Enum: General | Child | VIP | Event
    desc: '',
    price: 0
  });

  const handleOpenModal = (ticket = null) => {
    if (ticket) {
      setEditingTicket(ticket);
      setFormData({ ...ticket });
    } else {
      setEditingTicket(null);
      setFormData({ type: '', category: 'General', desc: '', price: 0 });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this ticket type?')) {
      setTickets(tickets.filter(t => t.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTicket) {
      setTickets(tickets.map(t => t.id === editingTicket.id ? { ...formData, id: t.id } : t));
    } else {
      const newTicket = { ...formData, id: Date.now().toString() };
      setTickets([...tickets, newTicket]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title">
            <Ticket className="title-icon" size={28} /> Manage Tickets
          </h1>
          <p className="admin-page-subtitle">Configure ticket pricing and categories.</p>
        </div>

        <div className="admin-page-actions">
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Ticket Type
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', color: '#1e3a8a' }}>
        <Info size={20} style={{ color: '#2563eb' }} />
        <p style={{ fontSize: '0.95rem' }}>
          <strong>Notice:</strong> To change ticket pricing, please contact the IT Administrator or submit a helpdesk ticket. Direct modifications are restricted per financial compliance rules.
        </p>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Ticket Name</th>
              <th>Category Type</th>
              <th>Description</th>
              <th style={{textAlign: 'right'}}>Price</th>
              <th className="align-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="text-secondary">{ticket.id}</td>
                <td className="font-medium text-dark">{ticket.type}</td>
                <td>
                  <span className={`pill-badge ${ticket.category === 'VIP' ? '' : 'outline'}`} 
                        style={ticket.category === 'VIP' ? {backgroundColor: '#dcfce7', color: '#166534'} : {}}>
                    {ticket.category}
                  </span>
                </td>
                <td className="text-secondary">{ticket.desc}</td>
                <td className="font-medium text-dark" style={{textAlign: 'right'}}>${Number(ticket.price).toFixed(2)}</td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn edit" onClick={() => handleOpenModal(ticket)}><Edit2 size={16} /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(ticket.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', padding: '32px', color: '#64748b'}}>
                  No tickets configured.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModalForm 
        title={editingTicket ? "Edit Ticket Type" : "Add New Ticket"} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Ticket Name</label>
            <input type="text" placeholder="e.g. Adult Admission" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Category (Type Name Enum)</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option value="General">General</option>
              <option value="Child">Child</option>
              <option value="VIP">VIP</option>
              <option value="Event">Event</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <input type="text" placeholder="e.g. Single day access for guests 13-64" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} required />
        </div>
        
        <div className="form-group">
          <label>Price ($)</label>
          <input type="number" min="0" step="0.01" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required />
        </div>
      </AdminModalForm>

    </div>
  );
};

export default ManageTickets;
