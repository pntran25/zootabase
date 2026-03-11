import React, { useState } from 'react';
import '../AdminTable.css';
import { TicketCheck, Search, Plus, Edit2, Trash2 } from 'lucide-react';

import AdminModalForm from '../AdminModalForm';

// Mapping to Attraction Schema: AttractionID, AttractionName, AttractionType, LocationDesc, CapacityVisitor, ActiveFlag
const initialAttractions = [
  { id: '1', name: 'Safari Jeeps', type: 'Ride', location: 'Near Entrance A', duration: '25 min', price: 15.00, capacity: 40, active: true },
  { id: '2', name: 'Giraffe Feeding Station', type: 'Experience', location: 'African Savanna Deck', duration: '10 min', price: 5.00, capacity: 15, active: true }
];

const ManageAttractions = () => {
  const [attractions, setAttractions] = useState(initialAttractions);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState(null);
  
  // Form State aligned with Attraction Schema + UI fields
  const [formData, setFormData] = useState({
    name: '',
    type: 'Ride',
    location: '',
    duration: '',
    price: 0,
    capacity: 0,
    active: true
  });

  const filteredAttractions = attractions.filter(attr => 
    attr.name.toLowerCase().includes(search.toLowerCase()) ||
    attr.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (attraction = null) => {
    if (attraction) {
      setEditingAttraction(attraction);
      setFormData({ ...attraction });
    } else {
      setEditingAttraction(null);
      setFormData({ name: '', type: 'Ride', location: '', duration: '', price: 0, capacity: 0, active: true });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this attraction?')) {
      setAttractions(attractions.filter(a => a.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAttraction) {
      setAttractions(attractions.map(a => a.id === editingAttraction.id ? { ...formData, id: a.id } : a));
    } else {
      const newAttraction = { ...formData, id: Date.now().toString() };
      setAttractions([...attractions, newAttraction]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title">
            <TicketCheck className="title-icon" size={28} /> Manage Attractions
          </h1>
          <p className="admin-page-subtitle">Configure rides, shows, and experiences.</p>
        </div>
        
        <div className="admin-page-actions">
          <div className="admin-search-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search attractions..." 
              className="admin-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Attraction
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Attraction Name</th>
              <th>Type</th>
              <th>Location & Duration</th>
              <th>Price</th>
              <th className="align-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttractions.map((attr) => (
              <tr key={attr.id} style={{ opacity: attr.active ? 1 : 0.6 }}>
                <td className="font-medium text-dark">{attr.name}</td>
                <td><span className="pill-badge outline" style={{color: '#9a3412', borderColor: '#fdba74', backgroundColor: '#fff7ed'}}>{attr.type}</span></td>
                <td>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start'}}>
                    <span className="text-dark">{attr.location}</span>
                    <span className="text-secondary">{attr.duration} &bull; Cap: {attr.capacity}</span>
                  </div>
                </td>
                <td className="font-medium" style={{color: '#16a34a'}}>${Number(attr.price).toFixed(2)}</td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn edit" onClick={() => handleOpenModal(attr)}><Edit2 size={16} /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(attr.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAttractions.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '32px', color: '#64748b'}}>
                  No attractions found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModalForm 
        title={editingAttraction ? "Edit Attraction" : "Add New Attraction"} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Attraction Name</label>
            <input type="text" placeholder="e.g. Safari Jeeps" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Attraction Type</label>
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="Ride">Ride</option>
              <option value="Experience">Experience</option>
              <option value="Show">Show</option>
              <option value="Tour">Tour</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Location Map/Description</label>
          <input type="text" placeholder="e.g. Near Entrance A" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Visitor Capacity</label>
            <input type="number" min="0" placeholder="0" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} required />
          </div>
          <div className="form-group">
            <label>Duration (time)</label>
            <input type="text" placeholder="e.g. 25 min" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Extra Cost / Price ($)</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
          </div>
          <div className="form-group checkbox-group" style={{marginTop: '24px'}}>
            <input type="checkbox" id="active-flag" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} />
            <label htmlFor="active-flag">Active / Open to Public</label>
          </div>
        </div>
      </AdminModalForm>

    </div>
  );
};

export default ManageAttractions;
