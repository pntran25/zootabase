import React, { useState, useEffect } from 'react';
import '../AdminTable.css';
import { PawPrint, Search, Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';

import AdminModalForm from '../AdminModalForm';
import animalService from '../../../services/animalService';
import { API_BASE_URL } from '../../../services/apiClient';

const ManageAnimals = () => {
  const [animals, setAnimals] = useState([]);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  
  // Form State aligned with Animal Schema
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    exhibit: '', 
    age: '',
    gender: 'Unknown',
    diet: '',
    health: 'Good',
    dateArrived: '',
    lifespan: '',
    weight: '',
    region: '',
    funFact: ''
  });
  const [imageFile, setImageFile] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await animalService.getAllAnimals();
      setAnimals(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load animals:', err);
      setError('Failed to load animals. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAnimals = animals.filter(animal => 
    animal.name.toLowerCase().includes(search.toLowerCase()) || 
    animal.species.toLowerCase().includes(search.toLowerCase())
  );

  const getHealthColor = (health) => {
    switch(health) {
      case 'Excellent': return { bg: '#dcfce7', text: '#166534', dot: '#22c55e' };
      case 'Good': return { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' };
      case 'Fair': return { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' };
      case 'Needs Checkup': return { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' };
      case 'Critical': return { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' };
      default: return { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' };
    }
  };

  const handleOpenModal = (animal = null) => {
    if (animal) {
      setEditingAnimal(animal);
      setFormData({ 
        name: animal.name || '', 
        species: animal.species || '', 
        exhibit: animal.exhibit || '', 
        age: animal.age || 0, 
        gender: animal.gender || 'Unknown', 
        diet: animal.diet || '', 
        health: animal.health || 'Good', 
        dateArrived: animal.dateArrived ? animal.dateArrived.split('T')[0] : '',
        lifespan: animal.lifespan || '',
        weight: animal.weight || '',
        region: animal.region || '',
        funFact: animal.funFact || ''
      });
      setImageFile(null);
    } else {
      setEditingAnimal(null);
      setFormData({ name: '', species: '', exhibit: '', age: '', gender: 'Unknown', diet: '', health: 'Good', dateArrived: '', lifespan: '', weight: '', region: '', funFact: '' });
      setImageFile(null);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this animal?')) {
      try {
        await animalService.deleteAnimal(id);
        setAnimals(animals.filter(a => a.id !== id));
      } catch (err) {
        alert('Failed to delete animal');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData };

    try {
      let savedAnimalId = null;

      if (editingAnimal) {
        await animalService.updateAnimal(editingAnimal.id, payload);
        savedAnimalId = editingAnimal.id;
      } else {
        const result = await animalService.createAnimal(payload);
        savedAnimalId = result.id;
      }

      if (imageFile && savedAnimalId) {
        await animalService.uploadAnimalImage(savedAnimalId, imageFile);
      }

      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save animal. Please check your inputs and try again.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title">
            <PawPrint className="title-icon" size={28} /> Manage Animals
          </h1>
          <p className="admin-page-subtitle">View, add, edit, or remove zoo animals.</p>
        </div>
        
        <div className="admin-page-actions">
          <div className="admin-search-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search animals..." 
              className="admin-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Animal
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading animals...</div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{width: '60px'}}>Image</th>
                <th>Name</th>
                <th>Species</th>
                <th>Exhibit</th>
                <th>Diet / Age</th>
                <th>Health</th>
                <th className="align-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnimals.map((animal) => {
                const colors = getHealthColor(animal.health);
                return (
                <tr key={animal.id}>
                  <td>
                    {animal.imageUrl ? (
                      <img 
                        src={`${API_BASE_URL}${animal.imageUrl}`} 
                        alt={animal.name} 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td className="font-medium text-dark">{animal.name}</td>
                  <td className="text-secondary">{animal.species}</td>
                  <td><span className="pill-badge outline">{animal.exhibit}</span></td>
                  <td>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem'}}>
                        <span className="text-secondary">Diet: <span className="text-dark font-medium">{animal.diet || 'Unknown'}</span></span>
                        <span className="text-secondary">Age: <span className="text-dark font-medium">{animal.age} yrs</span> ({animal.gender})</span>
                      </div>
                  </td>
                  <td>
                    <span className="status-badge" style={{backgroundColor: colors.bg, color: colors.text}}>
                        <span className="status-indicator-dot" style={{backgroundColor: colors.dot}}></span>
                        {animal.health}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn edit" onClick={() => handleOpenModal(animal)}><Edit2 size={16} /></button>
                      <button className="action-btn delete" onClick={() => handleDelete(animal.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )})}
              {filteredAnimals.length === 0 && (
                <tr>
                  <td colSpan="7" style={{textAlign: 'center', padding: '32px', color: '#64748b'}}>
                    No animals found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <AdminModalForm 
        title={editingAnimal ? "Edit Animal Record" : "Add New Animal"} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input type="text" placeholder="Animal Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Species</label>
            <input type="text" placeholder="Species" value={formData.species} onChange={e => setFormData({...formData, species: e.target.value})} required />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Age (Years)</label>
            <input type="number" min="0" placeholder="0" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Assign to Exhibit (Habitat)</label>
            <input type="text" placeholder="Exhibit Name" value={formData.exhibit} onChange={e => setFormData({...formData, exhibit: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Date Arrived</label>
            <input type="date" value={formData.dateArrived} onChange={e => setFormData({...formData, dateArrived: e.target.value})} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Diet Type</label>
            <input type="text" placeholder="e.g. Carnivore, Herbivore" value={formData.diet} onChange={e => setFormData({...formData, diet: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Health Score / Status</label>
            <select value={formData.health} onChange={e => setFormData({...formData, health: e.target.value})}>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Needs Checkup">Needs Checkup</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Profile Image</label>
          <input 
             type="file" 
             accept="image/*" 
             onChange={e => setImageFile(e.target.files[0])} 
             style={{display: 'block', marginTop: '8px'}}
          />
          <small className="text-secondary">If no image is provided, a placeholder will be used.</small>
        </div>

        {/* Quick Facts Section */}
        <h4 style={{margin: '18px 0 8px', color: '#374151', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid #e5e7eb', paddingTop: '14px'}}>Quick Facts (Hover Info)</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Lifespan</label>
            <input type="text" placeholder="e.g. 10-14 years" value={formData.lifespan} onChange={e => setFormData({...formData, lifespan: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Weight</label>
            <input type="text" placeholder="e.g. 265-420 lbs" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Region</label>
            <input type="text" placeholder="e.g. Africa" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Interesting Fact</label>
            <input type="text" placeholder="Short fun fact" value={formData.funFact} onChange={e => setFormData({...formData, funFact: e.target.value})} />
          </div>
        </div>
      </AdminModalForm>

    </div>
  );
};

export default ManageAnimals;
