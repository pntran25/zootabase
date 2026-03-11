import React, { useState } from 'react';
import '../AdminTable.css';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import AdminModalForm from '../AdminModalForm';

// Mocked Feedback Schema: ID, Rating, Comment, Location, Date
const initialFeedback = [
  { id: '1', rating: 5, comment: '"The giraffe feeding was the best part of our day!"', location: 'African Savanna', date: '2023-11-05' },
  { id: '2', rating: 4, comment: '"Loved the penguins, but it was too crowded."', location: 'Penguin Coast', date: '2023-11-06' },
];

const renderStars = (rating) => {
  return (
    <div style={{ color: '#eab308', letterSpacing: '2px', fontSize: '1.2rem' }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </div>
  );
};

const GuestFeedback = () => {
  const [feedbackList, setFeedbackList] = useState(initialFeedback);
  const [filterRating, setFilterRating] = useState('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State aligned with Mock Schema
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    location: '',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredFeedback = feedbackList.filter(f => {
    if (filterRating === 'All') return true;
    if (filterRating === '5') return f.rating === 5;
    if (filterRating === '4') return f.rating === 4;
    return f.rating <= 3;
  });

  const handleOpenModal = () => {
    setFormData({ rating: 5, comment: '', location: '', date: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this feedback record?')) {
      setFeedbackList(feedbackList.filter(f => f.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newFeedback = { ...formData, id: Date.now().toString() };
    setFeedbackList([newFeedback, ...feedbackList]);
    setIsModalOpen(false);
  };

  const averageRating = feedbackList.length > 0 
    ? (feedbackList.reduce((acc, f) => acc + f.rating, 0) / feedbackList.length).toFixed(1) 
    : '0.0';

  return (
    <div className="admin-page">
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title">
            <MessageSquare className="title-icon" size={28} /> Guest Feedback
          </h1>
          <p className="admin-page-subtitle">Review survey results and comments from zoo visitors.</p>
        </div>
        
        <div className="admin-page-actions" style={{display: 'flex', gap: '12px'}}>
           <select 
             style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', color: '#334155' }}
             value={filterRating}
             onChange={(e) => setFilterRating(e.target.value)}
           >
             <option value="All">All Ratings</option>
             <option value="5">5 Stars</option>
             <option value="4">4 Stars</option>
             <option value="3">3 Stars & Below</option>
           </select>
           <button className="admin-btn-primary" onClick={handleOpenModal}>
             <Plus size={18} /> Add Mock Feedback
           </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flex: 1 }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '8px' }}>Total Responses</p>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>{feedbackList.length}</h2>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flex: 1 }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '8px' }}>Average Rating</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>{averageRating} <span style={{fontSize:'1.5rem', color: '#eab308'}}>★</span></h2>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Rating</th>
              <th>Comment</th>
              <th>Location Tag</th>
              <th>Date</th>
              <th className="align-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedback.map((feedback) => (
              <tr key={feedback.id}>
                <td>{renderStars(feedback.rating)}</td>
                <td className="text-dark" style={{ fontStyle: 'italic' }}>{feedback.comment}</td>
                <td><span className="pill-badge outline">{feedback.location}</span></td>
                <td className="text-secondary" style={{display:'flex', alignItems:'center', gap:'6px'}}>
                  <span style={{color: '#cbd5e1'}}>🕒</span> {feedback.date}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn delete" onClick={() => handleDelete(feedback.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredFeedback.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '32px', color: '#64748b'}}>
                  No feedback found matching the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModalForm 
        title="Add Mock Feedback" 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Rating (1-5)</label>
            <input type="number" min="1" max="5" value={formData.rating} onChange={e => setFormData({...formData, rating: Number(e.target.value)})} required />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
          </div>
        </div>

        <div className="form-group">
          <label>Location Tag</label>
          <input type="text" placeholder="e.g. African Savanna" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
        </div>
        
        <div className="form-group">
          <label>Comment</label>
          <textarea 
            placeholder="Guest feedback comment here..." 
            value={formData.comment} 
            onChange={e => setFormData({...formData, comment: e.target.value})} 
            required 
            style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontFamily: 'inherit', minHeight: '80px', resize: 'vertical' }}
          />
        </div>
      </AdminModalForm>

    </div>
  );
};

export default GuestFeedback;
