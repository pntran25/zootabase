import React, { useState } from 'react';
import '../AdminTable.css';
import { Map, Search, Plus, Edit2, Trash2 } from 'lucide-react';

import AdminModalForm from '../AdminModalForm';

// Mapping to Exhibit Schema: ExhibitID, ExhibitName, AreaID(Name), Capacity, OpeningHours, HabitatType
const initialExhibits = [
  { id: '1', name: 'African Savanna', area: 'Africa', habitat: 'Grassland', capacity: 500, openingHours: '09:00-17:00' },
  { id: '2', name: 'Primate Forest', area: 'Jungle', habitat: 'Rainforest', capacity: 250, openingHours: '09:00-17:00' },
  { id: '3', name: 'Penguin Coast', area: 'Arctic', habitat: 'Tundra / Aquatic', capacity: 150, openingHours: '09:00-16:30' },
  { id: '4', name: 'Asian Highlands', area: 'Asia', habitat: 'Mountain Forest', capacity: 300, openingHours: '09:00-17:00' },
  { id: '5', name: 'Outback Adventure', area: 'Australia', habitat: 'Desert Scrub', capacity: 400, openingHours: '09:00-18:00' },
  { id: '6', name: 'Reptile House', area: 'Reptiles', habitat: 'Indoor Terrarium', capacity: 100, openingHours: '10:00-16:00' },
];

const ManageExhibits = () => {
  const [exhibits, setExhibits] = useState(initialExhibits);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExhibit, setEditingExhibit] = useState(null);
  
  // Form State aligned with Exhibit Schema
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    habitat: '',
    capacity: 0,
    openingHours: ''
  });

  const filteredExhibits = exhibits.filter(exhibit => 
    exhibit.name.toLowerCase().includes(search.toLowerCase()) || 
    exhibit.area.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (exhibit = null) => {
    if (exhibit) {
      setEditingExhibit(exhibit);
      setFormData({ ...exhibit });
    } else {
      setEditingExhibit(null);
      setFormData({ name: '', area: '', habitat: '', capacity: 0, openingHours: '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this exhibit?')) {
      setExhibits(exhibits.filter(e => e.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingExhibit) {
      setExhibits(exhibits.map(ex => ex.id === editingExhibit.id ? { ...formData, id: ex.id } : ex));
    } else {
      const newExhibit = { ...formData, id: Date.now().toString() };
      setExhibits([...exhibits, newExhibit]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title">
            <Map className="title-icon" size={28} /> Manage Exhibits
          </h1>
          <p className="admin-page-subtitle">Configure animal habitats and zoo areas.</p>
        </div>
        
        <div className="admin-page-actions">
          <div className="admin-search-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search exhibits..." 
              className="admin-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Exhibit
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Exhibit Name</th>
              <th>Theme / Habitat</th>
              <th>Capacity</th>
              <th>Opening Hours</th>
              <th className="align-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExhibits.map((exhibit) => (
              <tr key={exhibit.id}>
                <td className="font-medium text-dark">{exhibit.name}</td>
                <td>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start'}}>
                    <span className="pill-badge outline">{exhibit.area}</span>
                    <span className="text-secondary">{exhibit.habitat}</span>
                  </div>
                </td>
                <td><span className="status-badge open" style={{backgroundColor: '#1e293b', color: 'white'}}>{exhibit.capacity} Visitors</span></td>
                <td className="text-secondary">{exhibit.openingHours}</td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn edit" onClick={() => handleOpenModal(exhibit)}><Edit2 size={16} /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(exhibit.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredExhibits.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '32px', color: '#64748b'}}>
                  No exhibits found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModalForm 
        title={editingExhibit ? "Edit Exhibit" : "Add New Exhibit"} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Exhibit Name</label>
            <input type="text" placeholder="e.g. African Savanna" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Area Designation</label>
            <input type="text" placeholder="e.g. Africa" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required />
          </div>
        </div>

        <div className="form-group">
          <label>Habitat Type</label>
          <input type="text" placeholder="e.g. Grassland, Aquatic" value={formData.habitat} onChange={e => setFormData({...formData, habitat: e.target.value})} />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Max Capacity (Visitors)</label>
            <input type="number" min="0" placeholder="0" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} required />
          </div>
          <div className="form-group">
            <label>Opening Hours</label>
            <input type="text" placeholder="e.g. 09:00-17:00" value={formData.openingHours} onChange={e => setFormData({...formData, openingHours: e.target.value})} required />
          </div>
        </div>
      </AdminModalForm>

    </div>
  );
};

export default ManageExhibits;
