import React, { useState, useEffect } from 'react';
import '../AdminTable.css';
import { CalendarDays, Search, Plus, Edit2, Trash2 } from 'lucide-react';

import AdminModalForm from '../AdminModalForm';
import eventService from '../../../services/eventService';

const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);

  // Form State aligned with Event Schema
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    exhibit: '',
    capacity: 0
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await eventService.getAllEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEvents = events.filter(event => 
    event.name.toLowerCase().includes(search.toLowerCase()) ||
    event.exhibit.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setFormData({ ...event });
    } else {
      setEditingEvent(null);
      setFormData({ name: '', date: '', startTime: '', endTime: '', exhibit: '', capacity: 0 });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(id);
        setEvents(events.filter(e => e.id !== id));
      } catch (err) {
        alert('Failed to delete event.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const startStr = formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime;
      const endStr = formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime;
      
      const payload = { ...formData, startTime: startStr, endTime: endStr };

      if (editingEvent) {
        await eventService.updateEvent(editingEvent.id, payload);
      } else {
        await eventService.createEvent(payload);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to save event.');
      console.error(err);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title">
            <CalendarDays className="title-icon" size={28} /> Manage Events
          </h1>
          <p className="admin-page-subtitle">Configure daily schedules, keeper talks, and tours.</p>
        </div>
        
        <div className="admin-page-actions">
          <div className="admin-search-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search events..." 
              className="admin-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Event
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Date</th>
              <th>Time Window</th>
              <th>Location (Exhibit)</th>
              <th>Capacity</th>
              <th className="align-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '32px'}}>Loading...</td></tr>
            ) : filteredEvents.map((evt) => (
              <tr key={evt.id}>
                <td className="font-medium text-dark">{evt.name}</td>
                <td className="text-secondary">{evt.date}</td>
                <td className="text-secondary">{evt.startTime} - {evt.endTime}</td>
                <td><span className="pill-badge outline">{evt.exhibit}</span></td>
                <td><span className="status-badge" style={{backgroundColor: '#f1f5f9', color: '#475569'}}>{evt.capacity} entries</span></td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn edit" onClick={() => handleOpenModal(evt)}><Edit2 size={16} /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(evt.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filteredEvents.length === 0 && (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', padding: '32px', color: '#64748b'}}>
                  No events found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModalForm 
        title={editingEvent ? "Edit Event" : "Add New Event"} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label>Event Name</label>
          <input type="text" placeholder="e.g. Lion Keeper Talk" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Event Date</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Location (Exhibit ID/Name)</label>
            <input type="text" placeholder="e.g. African Savanna" value={formData.exhibit} onChange={e => setFormData({...formData, exhibit: e.target.value})} required />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Start Time</label>
            <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} required />
          </div>
        </div>

        <div className="form-group">
          <label>Max Capacity</label>
          <input type="number" min="0" placeholder="0" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} required />
        </div>
      </AdminModalForm>

    </div>
  );
};

export default ManageEvents;
