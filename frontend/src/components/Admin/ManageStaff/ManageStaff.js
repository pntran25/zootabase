import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Edit2, Plus, Trash2, Users, ChevronUp, ChevronDown, ChevronsUpDown, Copy, Calendar, Search } from 'lucide-react';
import AdminModalForm from '../AdminModalForm';
import AdminSelect from '../AdminSelect';
import BirthDatePickerInput from '../BirthDatePickerInput';
import StaffScheduling from './StaffScheduling';
import { API_BASE_URL } from '../../../services/apiClient';
import '../AdminTable.css';

const DEFAULT_PASSWORD = 'ZooStaff2026!';

const ROLES = ['Super Admin', 'Zoo Manager', 'Caretaker', 'Event Coordinator', 'Ticket Staff', 'Shop Manager', 'Maintenance'];

const roleColors = {
  'Super Admin':       { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
  'Zoo Manager':       { bg: 'rgba(8,145,178,0.15)',   color: '#0891b2' },
  'Caretaker':         { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
  'Event Coordinator': { bg: 'rgba(168,85,247,0.15)',  color: '#a855f7' },
  'Ticket Staff':      { bg: 'rgba(234,179,8,0.15)',   color: '#ca8a04' },
  'Shop Manager':      { bg: 'rgba(249,115,22,0.15)',  color: '#ea580c' },
  'Maintenance':       { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
};

const ManageStaff = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [ssnError, setSsnError] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [searchStaff, setSearchStaff] = useState('');
  const [activeTab, setActiveTab] = useState('staff');

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
    setSsnError('');
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        firstName: staff.FirstName || '',
        lastName: staff.LastName || '',
        email: staff.Email || '',
        dateOfBirth: staff.DateOfBirth ? staff.DateOfBirth.substring(0, 10) : '',
        ssn: staff.SSN ? formatSSN(String(staff.SSN)) : '',
        role: staff.Role || 'Caretaker',
        contactNumber: staff.ContactNumber ? formatPhone(String(staff.ContactNumber)) : '',
        salary: staff.Salary || ''
      });
    } else {
      setEditingStaff(null);
      setFormData({ firstName: '', lastName: '', email: '', dateOfBirth: '', ssn: '', role: 'Caretaker', contactNumber: '', salary: '' });
    }
    setShowModal(true);
  };

  const handleSsnChange = (val) => {
    const formatted = formatSSN(val);
    setFormData(f => ({ ...f, ssn: formatted }));
    const normalized = formatted.replace(/\D/g, '');
    if (normalized.length === 9) {
      const conflict = staffList.find(s =>
        s.SSN && s.SSN.replace(/\D/g, '') === normalized &&
        s.StaffID !== editingStaff?.StaffID
      );
      setSsnError(conflict
        ? `SSN is already in use by ${conflict.FirstName} ${conflict.LastName} — please re-enter a unique SSN.`
        : ''
      );
    } else {
      setSsnError('');
    }
  };

  const req = <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dateOfBirth) { toast.error('Date of birth is required.'); return; }
    if (!formData.ssn) { toast.error('SSN is required.'); return; }
    if (ssnError) { toast.error(ssnError); return; }
    try {
      const token = await getToken();
      const url = editingStaff ? `${API_BASE_URL}/api/staff/${editingStaff.StaffID}` : `${API_BASE_URL}/api/staff`;
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
      } else if (res.status === 409) {
        const data = await res.json();
        toast.error(data.error || 'SSN is already used by another employee.');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to save staff member');
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
          {activeTab === 'staff' && (
            <>
              <div className="admin-search-container">
                <Search size={16} className="admin-search-icon" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchStaff}
                  onChange={e => setSearchStaff(e.target.value)}
                  className="admin-search-input"
                />
              </div>
              <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={16} /> Add Staff
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 18, borderBottom: '1.5px solid var(--adm-border)' }}>
        {[
          { id: 'staff', label: 'Staff', icon: <Users size={15} /> },
          { id: 'scheduling', label: 'Scheduling', icon: <Calendar size={15} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 22px',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2.5px solid var(--adm-accent)' : '2.5px solid transparent',
              background: 'none',
              color: activeTab === tab.id ? 'var(--adm-accent)' : 'var(--adm-text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'scheduling' ? (
        <StaffScheduling />
      ) : (
      <>

      {/* ── Filter Row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap', padding: '10px 14px', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 2 }}>Role</span>
          <button onClick={() => setFilterRole('')}
            style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${!filterRole ? 'var(--adm-accent)' : 'var(--adm-border)'}`, background: !filterRole ? 'var(--adm-accent-dim, rgba(34,107,64,0.1))' : 'transparent', color: !filterRole ? 'var(--adm-accent)' : 'var(--adm-text-secondary)', transition: 'all 0.15s' }}>
            All
          </button>
          {ROLES.map(r => {
            const rc = roleColors[r] || {};
            const active = filterRole === r;
            return (
              <button key={r} onClick={() => setFilterRole(active ? '' : r)}
                style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? (rc.color || 'var(--adm-accent)') : 'var(--adm-border)'}`, background: active ? (rc.bg || 'var(--adm-accent-dim)') : 'transparent', color: active ? (rc.color || 'var(--adm-accent)') : 'var(--adm-text-secondary)', transition: 'all 0.15s' }}>
                {r}
              </button>
            );
          })}
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
                <th data-sorted={sortCol === 'name' ? sortDir : undefined} onClick={() => { setSortDir(sortCol === 'name' && sortDir === 'asc' ? 'desc' : 'asc'); setSortCol('name'); }}>
                  Name {sortCol === 'name' ? (sortDir === 'asc' ? <ChevronUp size={13} className="sort-icon" /> : <ChevronDown size={13} className="sort-icon" />) : <ChevronsUpDown size={13} className="sort-icon" />}
                </th>
                <th data-sorted={sortCol === 'role' ? sortDir : undefined} onClick={() => { setSortDir(sortCol === 'role' && sortDir === 'asc' ? 'desc' : 'asc'); setSortCol('role'); }}>
                  Role {sortCol === 'role' ? (sortDir === 'asc' ? <ChevronUp size={13} className="sort-icon" /> : <ChevronDown size={13} className="sort-icon" />) : <ChevronsUpDown size={13} className="sort-icon" />}
                </th>
                <th>Email</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...staffList].filter(s => {
                if (filterRole && s.Role !== filterRole) return false;
                if (searchStaff) {
                  const q = searchStaff.toLowerCase();
                  const full = `${s.FirstName} ${s.LastName}`.toLowerCase();
                  return full.includes(q) || (s.Email || '').toLowerCase().includes(q) || (s.Role || '').toLowerCase().includes(q);
                }
                return true;
              }).sort((a, b) => {
                const dir = sortDir === 'asc' ? 1 : -1;
                if (sortCol === 'name') return dir * (`${a.FirstName} ${a.LastName}`).localeCompare(`${b.FirstName} ${b.LastName}`);
                if (sortCol === 'role') return dir * (a.Role || '').localeCompare(b.Role || '');
                return 0;
              }).map(staff => {
                const colors = roleColors[staff.Role] || { bg: 'var(--adm-accent-dim)', color: 'var(--adm-accent)' };
                return (
                  <tr key={staff.StaffID}>
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
                    <td style={{ color: 'var(--adm-text-secondary)' }}>{staff.ContactNumber ? formatPhone(String(staff.ContactNumber)) : '—'}</td>
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
            <input
              type="text"
              value={formData.ssn}
              onChange={e => handleSsnChange(e.target.value)}
              placeholder="XXX-XX-XXXX"
              style={ssnError ? { borderColor: '#ef4444' } : undefined}
            />
            {ssnError && (
              <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                {ssnError}
              </span>
            )}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Phone Number <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>(optional)</span></label>
            <input type="text" value={formData.contactNumber} onChange={e => setFormData({ ...formData, contactNumber: formatPhone(e.target.value) })} placeholder="(555) 000-0000" />
          </div>
          {field(<>Salary <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>(optional)</span></>, 'salary', 'number', { step: '0.01', placeholder: '0.00' })}
        </div>
        {!editingStaff && (
          <div style={{
            marginTop: 4,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--adm-text-muted)', display: 'block', marginBottom: 2 }}>Default password for new staff who haven't set one previously</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: '#10b981', letterSpacing: '0.05em' }}>{DEFAULT_PASSWORD}</span>
            </div>
            <button
              type="button"
              title="Copy password"
              onClick={() => { navigator.clipboard.writeText(DEFAULT_PASSWORD); toast.success('Password copied!'); }}
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 6,
                color: '#10b981',
                cursor: 'pointer',
                padding: '5px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              <Copy size={13} /> Copy
            </button>
          </div>
        )}
      </AdminModalForm>
      </>
      )}
    </div>
  );
};

export default ManageStaff;
