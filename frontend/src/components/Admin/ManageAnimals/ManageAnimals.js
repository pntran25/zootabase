import React, { useState } from 'react';
import '../AdminTable.css';
import { PawPrint, Search, Plus, Edit2, Trash2 } from 'lucide-react';

import AdminModalForm from '../AdminModalForm';

const initialAnimals = [
  { id: '1', name: 'Leo', species: 'African Lion', exhibit: 'African Savanna', diet: 'Carnivore', age: 6, health: 'Excellent', gender: 'Male', dateArrived: '2020-05-12' },
  { id: '2', name: 'Gerry', species: 'Reticulated Giraffe', exhibit: 'African Savanna', diet: 'Herbivore', age: 4, health: 'Good', gender: 'Male', dateArrived: '2022-08-01' },
  { id: '3', name: 'Zara', species: 'Plains Zebra', exhibit: 'African Savanna', diet: 'Herbivore', age: 3, health: 'Excellent', gender: 'Female', dateArrived: '2023-01-15' },
  { id: '4', name: 'Kong', species: 'Silverback Gorilla', exhibit: 'Primate Forest', diet: 'Omnivore', age: 12, health: 'Fair', gender: 'Male', dateArrived: '2016-11-20' },
  { id: '5', name: 'Mimi', species: 'Chimpanzee', exhibit: 'Primate Forest', diet: 'Omnivore', age: 8, health: 'Good', gender: 'Female', dateArrived: '2019-03-10' },
  { id: '6', name: 'Pingu', species: 'Emperor Penguin', exhibit: 'Penguin Coast', diet: 'Carnivore', age: 5, health: 'Excellent', gender: 'Male', dateArrived: '2021-09-05' },
];

const ManageAnimals = () => {
  const [animals, setAnimals] = useState(initialAnimals);
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
    dateArrived: ''
  });

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
      setFormData({ ...animal });
    } else {
      setEditingAnimal(null);
      setFormData({ name: '', species: '', exhibit: '', age: '', gender: 'Unknown', diet: '', health: 'Good', dateArrived: '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this animal?')) {
      setAnimals(animals.filter(a => a.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAnimal) {
      setAnimals(animals.map(a => a.id === editingAnimal.id ? { ...formData, id: a.id } : a));
    } else {
      const newAnimal = { ...formData, id: Date.now().toString() };
      setAnimals([...animals, newAnimal]);
    }
    setIsModalOpen(false);
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
        <table className="admin-table">
          <thead>
            <tr>
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
                <td className="font-medium text-dark">{animal.name}</td>
                <td className="text-secondary">{animal.species}</td>
                <td><span className="pill-badge outline">{animal.exhibit}</span></td>
                <td>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem'}}>
                      <span className="text-secondary">Diet: <span className="text-dark font-medium">{animal.diet}</span></span>
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
          </tbody>
        </table>
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
      </AdminModalForm>

    </div>
  );
};

export default ManageAnimals;
