import React from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import './AdminModalForm.css';

const AdminModalForm = ({ title, isOpen, onClose, onSubmit, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="admin-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="admin-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2>{title}</h2>
              <button className="admin-modal-close" onClick={onClose} aria-label="Close">
                <X size={18} />
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
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminModalForm;
