import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Edit2, Plus, Trash2, Users } from 'lucide-react';
import AdminModalForm from '../AdminModalForm';
import AdminSelect from '../AdminSelect';
import BirthDatePickerInput from '../BirthDatePickerInput';
import { API_BASE_URL } from '../../../services/apiClient';
import '../AdminTable.css';

const ROLES = ['Super Admin', 'Caretaker', 'Event Coordinator', 'Ticket Staff', 'Shop Manager', 'Maintenance'];

const roleColors = {
  'Super Admin':       { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  'Caretaker':         { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  'Event Coordinator': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  'Ticket Staff':      { bg: 'rgba(234,179,8,0.15)',  color: '#ca8a04' },
  'Shop Manager':      { bg: 'rgba(249,115,22,0.15)', color: '#ea580c' },
  'Maintenance':       { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
};

const ManageStaff = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    ssn: '',
    role: 'Caretaker',
    contactNumber: '',
    salary: ''
  });

  const getToken = async () => {
    const { auth } = await import('../../../services/firebase');
    if (!auth.currentUser) throw new Error('Not authenticated');
    return auth.currentUser.getIdToken();
  };

  const fetchStaff = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStaffList(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleOpenModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        firstName:     staff.FirstName || '',
        lastName:      staff.LastName || '',
        email:         staff.Email || '',
        dateOfBirth:   staff.DateOfBirth ? staff.DateOfBirth.substring(0, 10) : '',
        ssn:           staff.SSN || '',
        role:          staff.Role || 'Caretaker',
        contactNumber: staff.ContactNumber || '',
        salary:        staff.Salary || ''
      });
    } else {
      setEditingStaff(null);
      setFormData({ firstName: '', lastName: '', email: '', dateOfBirth: '', ssn: '', role: 'Caretaker', contactNumber: '', salary: '' });
    }
    setShowModal(true);
  };

  const req = <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dateOfBirth) { toast.error('Date of birth is required.'); return; }
    if (!formData.ssn) { toast.error('SSN is required.'); return; }
    try {
      const token = await getToken();
      const url    = editingStaff ? `${API_BASE_URL}/api/staff/${editingStaff.StaffID}` : `${API_BASE_URL}/api/staff`;
      const method = editingStaff ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(`Staff member ${editingStaff ? 'updated' : 'added'} successfully`);
        setShowModal(false);
        fetchStaff();
      } else {
        toast.error('Failed to save staff member');
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  const handleDelete = async (staff) => {
    if (!window.confirm(`Remove ${staff.FirstName} ${staff.LastName}? This cannot be undone.`)) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/staff/${staff.StaffID}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Staff member removed');
        setStaffList(prev => prev.filter(s => s.StaffID !== staff.StaffID));
      } else {
        toast.error('Failed to remove staff member');
      }
    } catch (e) {
      toast.error('An error occurred');
    }
  };

  const formatSSN = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 9);
    if (d.length <= 3) return d;
    if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
  };

  const formatPhone = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const field = (label, key, type = 'text', extra = {}) => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        value={formData[key]}
        onChange={e => setFormData({ ...formData, [key]: e.target.value })}
        {...extra}
      />
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title"><Users size={26} className="title-icon" /> Staff Management</h1>
          <p className="admin-page-subtitle">{staffList.length} staff member{staffList.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add Staff
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-table-loading">Loading staff...</div>
        ) : staffList.length === 0 ? (
          <div className="admin-table-empty">No staff members found.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(staff => {
                const colors = roleColors[staff.Role] || { bg: 'var(--adm-accent-dim)', color: 'var(--adm-accent)' };
                return (
                  <tr key={staff.StaffID}>
                    <td style={{ fontWeight: 600, color: 'var(--adm-text-primary)' }}>{staff.StaffID}</td>
                    <td style={{ color: 'var(--adm-text-primary)' }}>{staff.FirstName} {staff.LastName}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: colors.bg,
                        color: colors.color,
                      }}>
                        {staff.Role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--adm-text-secondary)' }}>{staff.Email}</td>
                    <td style={{ color: 'var(--adm-text-secondary)' }}>{staff.ContactNumber || '—'}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit" onClick={() => handleOpenModal(staff)} title="Edit"><Edit2 size={15} /></button>
                        <button className="action-btn delete" onClick={() => handleDelete(staff)} title="Remove"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <AdminModalForm
        title={editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
      >
        <div className="form-row">
          {field(<>First Name{req}</>, 'firstName', 'text', { required: true, placeholder: 'First name' })}
          {field(<>Last Name{req}</>, 'lastName', 'text', { required: true, placeholder: 'Last name' })}
        </div>
        <div className="form-row">
          {field(<>Email{req}</>, 'email', 'email', { required: true, placeholder: 'staff@wildwoods.com' })}
          <div className="form-group">
            <label>Role{req}</label>
            <AdminSelect
              value={formData.role}
              onChange={val => setFormData({ ...formData, role: val })}
              options={ROLES}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Date of Birth{req}</label>
            <BirthDatePickerInput
              value={formData.dateOfBirth}
              onChange={val => setFormData({ ...formData, dateOfBirth: val })}
              placeholder="Select date of birth"
            />
          </div>
          <div className="form-group">
            <label>SSN{req}</label>
            <input type="text" value={formData.ssn} onChange={e => setFormData({ ...formData, ssn: formatSSN(e.target.value) })} placeholder="XXX-XX-XXXX" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Phone Number <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>(optional)</span></label>
            <input type="text" value={formData.contactNumber} onChange={e => setFormData({ ...formData, contactNumber: formatPhone(e.target.value) })} placeholder="(555) 000-0000" />
          </div>
          {field(<>Salary <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>(optional)</span></>, 'salary', 'number', { step: '0.01', placeholder: '0.00' })}
        </div>
      </AdminModalForm>
    </div>
  );
};

export default ManageStaff;
