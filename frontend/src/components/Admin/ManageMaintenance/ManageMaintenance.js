import React, { useState, useEffect } from 'react';
import '../AdminTable.css';
import { Wrench, Search, Plus, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import AdminModalForm from '../AdminModalForm';
import maintenanceService from '../../../services/maintenanceService';

const ManageMaintenance = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);

  // Form State aligned with MaintenanceRequest Schema
  const [formData, setFormData] = useState({
    issueType: '', // Maps to Description in Schema
    location: '', // Maps to ExhibitID context
    status: 'Pending', 
    date: new Date().toISOString().split('T')[0],
    priority: 'Low' // UI extra
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await maintenanceService.getAllMaintenance();
      // Map API Response to UI expected format
      const mapped = data.map(log => ({
        id: log.id,
        issueType: log.description,
        location: log.exhibit,
        date: log.dateSubmitted,
        status: log.status,
        reportedBy: log.reportedBy,
        priority: 'Medium' // DB schema does not have priority, using default Medium for UI
      }));
      setLogs(mapped);
    } catch (err) {
      console.error('Failed to load maintenance logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.issueType.toLowerCase().includes(search.toLowerCase()) || 
    log.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (log = null) => {
    if (log) {
      setEditingLog(log);
      setFormData({ 
        issueType: log.issueType, 
        location: log.location, 
        status: log.status, 
        date: log.date, 
        priority: log.priority 
      });
    } else {
      setEditingLog(null);
      setFormData({ issueType: '', location: '', status: 'Pending', date: new Date().toISOString().split('T')[0], priority: 'Medium' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        await maintenanceService.deleteMaintenance(id);
        setLogs(logs.filter(l => l.id !== id));
      } catch (err) {
        alert('Failed to delete maintenance log.');
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
        reportedBy: 'Admin User'
      };

      if (editingLog) {
        await maintenanceService.updateMaintenance(editingLog.id, payload);
      } else {
        await maintenanceService.createMaintenance(payload);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to save maintenance log.');
      console.error(err);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pending' ? 'In Progress' : (currentStatus === 'In Progress' ? 'Completed' : 'Pending');
    const log = logs.find(l => l.id === id);
    if (!log) return;
    
    try {
      const payload = {
        exhibit: log.location,
        description: log.issueType,
        dateSubmitted: log.date,
        status: newStatus,
        reportedBy: log.reportedBy || 'Admin User'
      };
      await maintenanceService.updateMaintenance(id, payload);
      setLogs(logs.map(l => l.id === id ? { ...l, status: newStatus } : l));
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title">
            <Wrench className="title-icon" size={28} /> Maintenance Logs
          </h1>
          <p className="admin-page-subtitle">Track and manage park repair requests.</p>
        </div>
        
        <div className="admin-page-actions">
          <div className="admin-search-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search requests..." 
              className="admin-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> New Request
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Issue Type</th>
              <th>Location (Area)</th>
              <th>Priority</th>
              <th>Status</th>
              <th className="align-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
               <tr><td colSpan="5" style={{textAlign: 'center', padding: '32px'}}>Loading...</td></tr>
            ) : filteredLogs.map((log) => (
              <tr key={log.id}>
                <td>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start'}}>
                    <span className="font-medium text-dark">{log.issueType}</span>
                    <span className="text-secondary" style={{fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px'}}>
                      <span style={{color:'#cbd5e1'}}>🕒</span> Reported {log.date}
                    </span>
                  </div>
                </td>
                <td className="text-secondary">{log.location}</td>
                <td>
                  <span className={`pill-badge outline`} 
                        style={log.priority === 'High' ? {color: '#ef4444', backgroundColor: '#fef2f2', borderColor: '#fca5a5'} : 
                               log.priority === 'Medium' ? {color: '#d97706', backgroundColor: '#fef3c7', borderColor: '#fde68a'} : 
                               {color: '#059669', backgroundColor: '#d1fae5', borderColor: '#6ee7b7'}}>
                    {log.priority}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${log.status === 'Pending' ? 'open' : log.status === 'In Progress' ? 'in progress' : 'resolved'}`}
                        style={log.status === 'Pending' ? {backgroundColor: '#1e293b', color: 'white'} : log.status === 'Completed' ? {backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0'} : {backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fef08a'}}>
                    {log.status === 'Pending' && <span className="status-indicator-dot" style={{backgroundColor: '#cbd5e1'}}></span>}
                    {log.status === 'In Progress' && <span className="status-indicator-dot" style={{backgroundColor: '#eab308'}}></span>}
                    {log.status === 'Completed' && <span className="status-indicator-dot" style={{backgroundColor: '#22c55e'}}></span>}
                    {log.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn" onClick={() => handleToggleStatus(log.id, log.status)} style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#10b981', padding: '6px 12px', border: '1px solid #10b981', borderRadius: '4px'}}>
                      <CheckCircle size={14} /> Toggle Status
                    </button>
                    <button className="action-btn edit" onClick={() => handleOpenModal(log)}><Edit2 size={16} /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(log.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filteredLogs.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '32px', color: '#64748b'}}>
                  No maintenance logs found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModalForm 
        title={editingLog ? "Edit Maintenance Request" : "New Maintenance Request"} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label>Issue Description</label>
          <input type="text" placeholder="e.g. Broken turnstile at Entrance A" value={formData.issueType} onChange={e => setFormData({...formData, issueType: e.target.value})} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Location (Area / Exhibit)</label>
            <input type="text" placeholder="e.g. Main Entrance" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Reported Date</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Priority</label>
            <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </AdminModalForm>

    </div>
  );
};

export default ManageMaintenance;
