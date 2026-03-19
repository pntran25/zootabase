import React, { useState, useEffect } from 'react';
import '../AdminTable.css';
import { TicketCheck, Search, Plus, Edit2, Trash2 } from 'lucide-react';

import AdminModalForm from '../AdminModalForm';
import attractionService from '../../../services/attractionService';

const ManageAttractions = () => {
  const [attractions, setAttractions] = useState([]);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);

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

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await attractionService.getAllAttractions();
      // Map DB ActiveFlag string back to boolean for the checkbox
      const mapped = data.map(item => ({
        ...item,
        active: item.status === 'Open',
        duration: item.duration || 'N/A' // backend schema doesn't have duration currently
      }));
      setAttractions(mapped);
    } catch (err) {
      console.error('Failed to load attractions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this attraction?')) {
      try {
        await attractionService.deleteAttraction(id);
        setAttractions(attractions.filter(a => a.id !== id));
      } catch (err) {
        alert('Failed to delete attraction.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map UI active boolean back to DB status string
      const payload = {
        ...formData,
        status: formData.active ? 'Open' : 'Closed'
      };
      
      if (editingAttraction) {
        await attractionService.updateAttraction(editingAttraction.id, payload);
      } else {
        await attractionService.createAttraction(payload);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to save attraction.');
      console.error(err);
    }
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
            {isLoading ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '32px'}}>Loading...</td></tr>
            ) : filteredAttractions.map((attr) => (
              <tr key={attr.id} style={{ opacity: attr.active ? 1 : 0.6 }}>
                <td className="font-medium text-dark">{attr.name}</td>
                <td><span className="pill-badge outline" style={{color: '#9a3412', borderColor: '#fdba74', backgroundColor: '#fff7ed'}}>{attr.type}</span></td>
                <td>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start'}}>
                    <span className="text-dark">{attr.location}</span>
                    <span className="text-secondary">{attr.duration} &bull; Cap: {attr.capacity}</span>
                  </div>
                </td>
                <td className="font-medium" style={{color: '#16a34a'}}>${Number(attr.price || 0).toFixed(2)}</td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn edit" onClick={() => handleOpenModal(attr)}><Edit2 size={16} /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(attr.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filteredAttractions.length === 0 && (
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
