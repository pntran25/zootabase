import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Clock, List, LayoutGrid, ChevronDown, ChevronUp, MapPin, Users } from 'lucide-react';
import AdminModalForm from '../AdminModalForm';
import AdminSelect from '../AdminSelect';
import { API_BASE_URL } from '../../../services/apiClient';

const SHIFT_PRESETS = [
  { label: 'Morning (6 AM – 2 PM)',   start: '06:00', end: '14:00' },
  { label: 'Afternoon (2 PM – 10 PM)',start: '14:00', end: '22:00' },
  { label: 'Full Day (8 AM – 5 PM)',  start: '08:00', end: '17:00' },
];

const ROLES = ['Super Admin', 'Zoo Manager', 'Caretaker', 'Event Coordinator', 'Ticket Staff', 'Shop Manager', 'Maintenance'];

const roleColors = {
  'Super Admin':       { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', dot: '#10b981' },
  'Zoo Manager':       { bg: 'rgba(8,145,178,0.15)',   color: '#0891b2', dot: '#0891b2' },
  'Caretaker':         { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6', dot: '#3b82f6' },
  'Event Coordinator': { bg: 'rgba(168,85,247,0.15)',  color: '#a855f7', dot: '#a855f7' },
  'Ticket Staff':      { bg: 'rgba(234,179,8,0.15)',   color: '#ca8a04', dot: '#ca8a04' },
  'Shop Manager':      { bg: 'rgba(249,115,22,0.15)',  color: '#ea580c', dot: '#ea580c' },
  'Maintenance':       { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', dot: '#ef4444' },
};

const MAX_VISIBLE_PER_DAY = 4;

const StaffScheduling = () => {
  const [schedules, setSchedules] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [exhibits, setExhibits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterStaff, setFilterStaff] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [viewMode, setViewMode] = useState('calendar');
  const [expandedDays, setExpandedDays] = useState({});
  const [filterWeek, setFilterWeek] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  });

  const [formData, setFormData] = useState({
    StaffID: '',
    WorkDate: '',
    ShiftStart: '08:00',
    ShiftEnd: '17:00',
    AssignedExhibitID: '',
  });

  const getToken = async () => {
    const { auth } = await import('../../../services/firebase');
    if (!auth.currentUser) throw new Error('Not authenticated');
    return auth.currentUser.getIdToken();
  };

  const fetchAll = async () => {
    try {
      const token = await getToken();
      const headers = { 'Authorization': `Bearer ${token}` };
      const [schedRes, staffRes, exhRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/staff-schedules`, { headers }),
        fetch(`${API_BASE_URL}/api/staff`, { headers }),
        fetch(`${API_BASE_URL}/api/exhibits`, { headers }),
      ]);
      setSchedules(await schedRes.json());
      setStaffList(await staffRes.json());
      const exhData = await exhRes.json();
      setExhibits(Array.isArray(exhData) ? exhData : exhData.exhibits || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const weekDays = useMemo(() => {
    const start = new Date(filterWeek + 'T00:00:00');
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, [filterWeek]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      if (filterStaff && String(s.StaffID) !== filterStaff) return false;
      if (filterRole && s.StaffRole !== filterRole) return false;
      const wd = (s.WorkDate || '').substring(0, 10);
      return wd >= weekDays[0] && wd <= weekDays[6];
    });
  }, [schedules, filterStaff, filterRole, weekDays]);

  // Stats for the summary bar
  const weekStats = useMemo(() => {
    const uniqueStaff = new Set(filteredSchedules.map(s => s.StaffID));
    return { totalShifts: filteredSchedules.length, staffCount: uniqueStaff.size };
  }, [filteredSchedules]);

  const handleOpenModal = (sched = null, prefillDate = null) => {
    if (sched) {
      setEditing(sched);
      setFormData({
        StaffID: String(sched.StaffID),
        WorkDate: (sched.WorkDate || '').substring(0, 10),
        ShiftStart: (sched.ShiftStart || '08:00').substring(0, 5),
        ShiftEnd: (sched.ShiftEnd || '17:00').substring(0, 5),
        AssignedExhibitID: sched.AssignedExhibitID ? String(sched.AssignedExhibitID) : '',
      });
    } else {
      setEditing(null);
      setFormData({
        StaffID: filterStaff || '',
        WorkDate: prefillDate || '',
        ShiftStart: '08:00',
        ShiftEnd: '17:00',
        AssignedExhibitID: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.StaffID || !formData.WorkDate || !formData.ShiftStart || !formData.ShiftEnd) {
      toast.error('Staff, date, and shift times are required.');
      return;
    }
    if (formData.ShiftEnd <= formData.ShiftStart) {
      toast.error('Shift end must be after shift start.');
      return;
    }
    try {
      const token = await getToken();
      const url = editing
        ? `${API_BASE_URL}/api/staff-schedules/${editing.ScheduleID}`
        : `${API_BASE_URL}/api/staff-schedules`;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success(`Schedule ${editing ? 'updated' : 'created'}`);
        setShowModal(false);
        fetchAll();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to save schedule');
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  const handleDelete = async (sched) => {
    if (!window.confirm(`Remove this shift for ${sched.StaffName}?`)) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/staff-schedules/${sched.ScheduleID}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Schedule removed');
        setSchedules(prev => prev.filter(s => s.ScheduleID !== sched.ScheduleID));
      } else {
        toast.error('Failed to remove schedule');
      }
    } catch (e) {
      toast.error('An error occurred');
    }
  };

  const navigateWeek = (dir) => {
    const d = new Date(weekDays[0] + 'T00:00:00');
    d.setDate(d.getDate() + (dir * 7));
    setFilterWeek(d.toISOString().split('T')[0]);
    setExpandedDays({});
  };

  const goToToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    setFilterWeek(d.toISOString().split('T')[0]);
    setExpandedDays({});
  };

  const fmtDay = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const fmtDayShort = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const fmtTime = (t) => {
    if (!t) return '';
    // Handle both "HH:MM" and ISO "1970-01-01T06:00:00.000Z" formats
    let timeStr = t;
    if (t.includes('T')) {
      timeStr = t.split('T')[1]?.substring(0, 5) || t;
    }
    const [h, m] = timeStr.substring(0, 5).split(':');
    const hr = parseInt(h, 10);
    if (isNaN(hr)) return t;
    const ampm = hr >= 12 ? 'PM' : 'AM';
    return `${hr % 12 || 12}:${m} ${ampm}`;
  };

  const toggleDayExpanded = (day) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const filteredStaffList = useMemo(() => {
    if (!filterRole) return staffList;
    return staffList.filter(s => s.Role === filterRole);
  }, [staffList, filterRole]);

  const req = <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>;

  if (loading) return <div className="admin-table-loading">Loading schedules...</div>;

  // ── Shift card (shared between views) ──
  const ShiftCard = ({ s, compact = false }) => {
    const rc = roleColors[s.StaffRole] || { bg: 'rgba(100,116,139,0.12)', color: '#64748b', dot: '#64748b' };
    return (
      <div style={{
        background: rc.bg,
        border: `1px solid ${rc.color}22`,
        borderRadius: 7,
        padding: compact ? '5px 7px' : '7px 10px',
        marginBottom: 5,
        fontSize: '0.76rem',
        borderLeft: `3px solid ${rc.color}`,
        transition: 'transform 0.1s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: 'var(--adm-text-primary)', fontSize: compact ? '0.73rem' : '0.78rem' }}>
            {s.StaffName}
          </span>
          <div style={{ display: 'flex', gap: 3 }}>
            <button onClick={() => handleOpenModal(s)} title="Edit"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: rc.color, padding: 1, opacity: 0.7 }}>
              <Edit2 size={11} />
            </button>
            <button onClick={() => handleDelete(s)} title="Remove"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 1, opacity: 0.7 }}>
              <Trash2 size={11} />
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--adm-text-secondary)', marginTop: 2, fontSize: '0.72rem' }}>
          <Clock size={10} />
          {fmtTime(s.ShiftStart)} – {fmtTime(s.ShiftEnd)}
        </div>
        {s.ExhibitName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--adm-text-muted)', marginTop: 2, fontSize: '0.68rem' }}>
            <MapPin size={9} /> {s.ExhibitName}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* ── Controls row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => navigateWeek(-1)} className="admin-btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>←</button>
          <button onClick={goToToday} className="admin-btn-secondary" style={{ padding: '5px 10px', fontSize: '0.75rem' }}>Today</button>
          <button onClick={() => navigateWeek(1)} className="admin-btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>→</button>
        </div>

        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--adm-text-primary)', minWidth: 180, textAlign: 'center' }}>
          {fmtDay(weekDays[0])} — {fmtDay(weekDays[6])}
        </span>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Role filter */}
          <AdminSelect
            value={filterRole}
            onChange={val => { setFilterRole(val); setFilterStaff(''); }}
            options={[{ value: '', label: 'All Roles' }, ...ROLES]}
            placeholder="All Roles"
            width={140}
          />

          {/* Staff filter */}
          <AdminSelect
            value={filterStaff}
            onChange={val => setFilterStaff(val)}
            options={[{ value: '', label: 'All Staff' }, ...filteredStaffList.map(s => ({ value: String(s.StaffID), label: `${s.FirstName} ${s.LastName}` }))]}
            placeholder="All Staff"
            searchable
            width={170}
          />

          {/* View toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--adm-border)', borderRadius: 7, overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('calendar')}
              title="Calendar view"
              style={{
                padding: '5px 8px', border: 'none', cursor: 'pointer',
                background: viewMode === 'calendar' ? 'var(--adm-accent)' : 'var(--adm-bg-surface)',
                color: viewMode === 'calendar' ? '#fff' : 'var(--adm-text-muted)',
              }}
            ><LayoutGrid size={14} /></button>
            <button
              onClick={() => setViewMode('list')}
              title="List view"
              style={{
                padding: '5px 8px', border: 'none', cursor: 'pointer',
                background: viewMode === 'list' ? 'var(--adm-accent)' : 'var(--adm-bg-surface)',
                color: viewMode === 'list' ? '#fff' : 'var(--adm-text-muted)',
              }}
            ><List size={14} /></button>
          </div>

          <button className="admin-btn-primary" onClick={() => handleOpenModal()} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            <Plus size={15} /> Add Shift
          </button>
        </div>
      </div>

      {/* ── Summary bar ── */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 14, padding: '8px 14px',
        background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 8,
        fontSize: '0.78rem', color: 'var(--adm-text-secondary)', alignItems: 'center',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Users size={13} /> <strong>{weekStats.staffCount}</strong> staff scheduled
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock size={13} /> <strong>{weekStats.totalShifts}</strong> total shifts
        </span>
        {filterRole && <span style={{ padding: '2px 8px', borderRadius: 4, background: (roleColors[filterRole] || {}).bg, color: (roleColors[filterRole] || {}).color, fontSize: '0.72rem', fontWeight: 600 }}>{filterRole}</span>}
        {filterStaff && <span style={{ fontSize: '0.72rem', color: 'var(--adm-text-muted)' }}>Filtered to 1 employee</span>}
      </div>

      {/* ── Calendar View ── */}
      {viewMode === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {weekDays.map(day => {
            const dayScheds = filteredSchedules.filter(s => (s.WorkDate || '').substring(0, 10) === day);
            const isToday = day === new Date().toISOString().split('T')[0];
            const isExpanded = expandedDays[day];
            const visibleScheds = isExpanded ? dayScheds : dayScheds.slice(0, MAX_VISIBLE_PER_DAY);
            const hiddenCount = dayScheds.length - MAX_VISIBLE_PER_DAY;

            return (
              <div key={day} style={{
                background: isToday ? 'rgba(59,130,246,0.05)' : 'var(--adm-bg-surface)',
                border: isToday ? '1.5px solid rgba(59,130,246,0.3)' : '1px solid var(--adm-border)',
                borderRadius: 9,
                padding: 8,
                minHeight: 100,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isToday ? '#3b82f6' : 'var(--adm-text-secondary)', display: 'block' }}>
                      {fmtDayShort(day)}
                    </span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--adm-text-muted)' }}>
                      {new Date(day + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {dayScheds.length > 0 && (
                      <span style={{
                        fontSize: '0.62rem', background: 'var(--adm-bg-main)', color: 'var(--adm-text-muted)',
                        padding: '1px 5px', borderRadius: 8, fontWeight: 600,
                      }}>{dayScheds.length}</span>
                    )}
                    <button
                      onClick={() => handleOpenModal(null, day)}
                      title="Add shift"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-muted)', padding: 1 }}
                    ><Plus size={13} /></button>
                  </div>
                </div>

                {dayScheds.length === 0 ? (
                  <span style={{ fontSize: '0.7rem', color: 'var(--adm-text-muted)', fontStyle: 'italic' }}>No shifts</span>
                ) : (
                  <>
                    {visibleScheds.map(s => <ShiftCard key={s.ScheduleID} s={s} compact />)}
                    {hiddenCount > 0 && (
                      <button
                        onClick={() => toggleDayExpanded(day)}
                        style={{
                          width: '100%', padding: '4px 0', border: 'none', borderRadius: 5, cursor: 'pointer',
                          background: 'rgba(59,130,246,0.06)', color: '#3b82f6', fontSize: '0.7rem', fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                        }}
                      >
                        {isExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> +{hiddenCount} more</>}
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === 'list' && (
        <div style={{ border: '1px solid var(--adm-border)', borderRadius: 9, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--adm-bg-surface)', borderBottom: '1px solid var(--adm-border)' }}>
                <th style={{ textAlign: 'left', padding: '9px 12px', color: 'var(--adm-text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>Day</th>
                <th style={{ textAlign: 'left', padding: '9px 12px', color: 'var(--adm-text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>Staff</th>
                <th style={{ textAlign: 'left', padding: '9px 12px', color: 'var(--adm-text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '9px 12px', color: 'var(--adm-text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>Shift</th>
                <th style={{ textAlign: 'left', padding: '9px 12px', color: 'var(--adm-text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>Exhibit</th>
                <th style={{ textAlign: 'right', padding: '9px 12px', color: 'var(--adm-text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {weekDays.map(day => {
                const dayScheds = filteredSchedules
                  .filter(s => (s.WorkDate || '').substring(0, 10) === day)
                  .sort((a, b) => (a.ShiftStart || '').localeCompare(b.ShiftStart || ''));
                if (dayScheds.length === 0) return null;
                return dayScheds.map((s, idx) => {
                  const rc = roleColors[s.StaffRole] || { bg: 'rgba(100,116,139,0.12)', color: '#64748b' };
                  const isToday = day === new Date().toISOString().split('T')[0];
                  return (
                    <tr key={s.ScheduleID} style={{
                      borderBottom: '1px solid var(--adm-border)',
                      background: isToday ? 'rgba(59,130,246,0.03)' : 'transparent',
                    }}>
                      <td style={{ padding: '8px 12px', fontWeight: idx === 0 ? 600 : 400, color: isToday ? '#3b82f6' : 'var(--adm-text-primary)', fontSize: '0.78rem' }}>
                        {idx === 0 ? fmtDay(day) : ''}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--adm-text-primary)', fontWeight: 500 }}>{s.StaffName}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600, background: rc.bg, color: rc.color }}>
                          {s.StaffRole}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--adm-text-secondary)', fontSize: '0.78rem' }}>
                        {fmtTime(s.ShiftStart)} – {fmtTime(s.ShiftEnd)}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--adm-text-muted)', fontSize: '0.76rem' }}>
                        {s.ExhibitName || '—'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpenModal(s)} title="Edit"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: 0 }}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(s)} title="Remove"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0 }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })}
              {filteredSchedules.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--adm-text-muted)', fontSize: '0.82rem' }}>No shifts scheduled this week</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal ── */}
      <AdminModalForm
        title={editing ? 'Edit Shift' : 'Add Shift'}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label>Staff Member{req}</label>
          <AdminSelect
            value={formData.StaffID}
            onChange={val => setFormData({ ...formData, StaffID: val })}
            options={staffList.map(s => ({ value: String(s.StaffID), label: `${s.FirstName} ${s.LastName} — ${s.Role}` }))}
            placeholder="Select staff"
          />
        </div>
        <div className="form-group">
          <label>Work Date{req}</label>
          <input
            type="date"
            value={formData.WorkDate}
            onChange={e => setFormData({ ...formData, WorkDate: e.target.value })}
            required
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--adm-text-muted)', display: 'block', marginBottom: 4 }}>Quick Shift</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SHIFT_PRESETS.map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => setFormData({ ...formData, ShiftStart: p.start, ShiftEnd: p.end })}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--adm-border)',
                  background: formData.ShiftStart === p.start && formData.ShiftEnd === p.end ? 'rgba(59,130,246,0.15)' : 'var(--adm-bg-surface)',
                  color: formData.ShiftStart === p.start && formData.ShiftEnd === p.end ? '#3b82f6' : 'var(--adm-text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Shift Start{req}</label>
            <input type="time" value={formData.ShiftStart} onChange={e => setFormData({ ...formData, ShiftStart: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Shift End{req}</label>
            <input type="time" value={formData.ShiftEnd} onChange={e => setFormData({ ...formData, ShiftEnd: e.target.value })} required />
          </div>
        </div>
        <div className="form-group">
          <label>Assigned Exhibit <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>(optional)</span></label>
          <AdminSelect
            value={formData.AssignedExhibitID}
            onChange={val => setFormData({ ...formData, AssignedExhibitID: val })}
            options={[{ value: '', label: 'None' }, ...exhibits.map(e => ({ value: String(e.ExhibitID), label: e.ExhibitName }))]}
            placeholder="Select exhibit"
          />
        </div>
      </AdminModalForm>
    </div>
  );
};

export default StaffScheduling;
