import React from 'react';
import { X } from 'lucide-react';
import './AdminModalForm.css';

const AdminModalForm = ({ title, isOpen, onClose, onSubmit, children }) => {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-container">
        <div className="admin-modal-header">
          <h2>{title}</h2>
          <button className="admin-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="admin-modal-content">
          <form onSubmit={onSubmit}>
            {children}
            <div className="admin-modal-actions">
              <button type="button" className="admin-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="admin-btn-primary">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminModalForm;
