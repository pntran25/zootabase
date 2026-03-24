import { useState, useEffect, useCallback } from 'react';
import { LineChart } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../../services/apiClient';
import AdminSelect from '../AdminSelect';
import AdminDatePicker from '../AdminDatePicker';
import '../AdminTable.css';

const roleColors = {
  'Super Admin':       { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
  'Caretaker':         { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
  'Event Coordinator': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  'Ticket Staff':      { bg: 'rgba(234,179,8,0.15)',   color: '#ca8a04' },
  'Shop Manager':      { bg: 'rgba(249,115,22,0.15)',  color: '#ea580c' },
  'Maintenance':       { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
};

const RANGE_OPTIONS = [
  { value: 'today',   label: 'Today' },
  { value: 'week',    label: 'This Week' },
  { value: 'month',   label: 'This Month' },
  { value: 'custom',  label: 'Custom Range' },
];

function getDateRange(range) {
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  if (range === 'today') {
    return { start: fmt(today), end: fmt(today) };
  }
  if (range === 'week') {
    const mon = new Date(today);
    mon.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    return { start: fmt(mon), end: fmt(today) };
  }
  if (range === 'month') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: fmt(first), end: fmt(today) };
  }
  return null; // custom — caller provides dates
}

const LoginAnalytics = () => {
    const [stats, setStats] = useState({ staffLogins: [], customerLogins: [] });
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('today');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd]     = useState('');

    const today = new Date().toISOString().split('T')[0];

    const fetchAnalytics = useCallback(async (start, end) => {
        if (!start || !end) return;
        setLoading(true);
        try {
            const { auth } = await import('../../../services/firebase');
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(
                `${API_BASE_URL}/api/analytics/logins?startDate=${start}&endDate=${end}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load login analytics');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch whenever range or custom dates change
    useEffect(() => {
        if (range !== 'custom') {
            const { start, end } = getDateRange(range);
            fetchAnalytics(start, end);
        } else if (customStart && customEnd) {
            fetchAnalytics(customStart, customEnd);
        }
    }, [range, customStart, customEnd, fetchAnalytics]);

    const formatDate = (d) => new Date(d).toLocaleString();

    const Panel = ({ title, count, children }) => (
        <div className="admin-table-container" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--adm-border)',
                background: 'var(--adm-bg-surface-2)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--adm-text-primary)' }}>{title}</h2>
                {count != null && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--adm-text-secondary)' }}>
                        {count} login{count !== 1 ? 's' : ''}
                    </span>
                )}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
                {children}
            </div>
        </div>
    );

    return (
        <div className="admin-page">
            <div className="admin-page-header-container">
                <div>
                    <h1 className="admin-page-title"><LineChart size={26} className="title-icon" /> Login Analytics</h1>
                    <p className="admin-page-subtitle">Recent login activity across staff and public users.</p>
                </div>

                {/* Date range selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {range === 'custom' && (
                        <>
                            <AdminDatePicker
                                value={customStart}
                                onChange={setCustomStart}
                                placeholder="Start date"
                                maxDate={customEnd || today}
                            />
                            <span style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>to</span>
                            <AdminDatePicker
                                value={customEnd}
                                onChange={setCustomEnd}
                                placeholder="End date"
                                minDate={customStart}
                                maxDate={today}
                            />
                        </>
                    )}
                    <AdminSelect
                        value={range}
                        onChange={v => { setRange(v); setCustomStart(''); setCustomEnd(''); }}
                        options={RANGE_OPTIONS}
                        width="148px"
                    />
                </div>
            </div>

            {loading ? (
                <div className="admin-table-container"><div className="admin-table-loading">Loading analytics...</div></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, minHeight: 0 }}>
                    <Panel title="Recent Staff Logins" count={stats.staffLogins?.length}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Staff</th>
                                    <th>Role</th>
                                    <th style={{ textAlign: 'left' }}>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.staffLogins?.length === 0 && (
                                    <tr><td colSpan="3" className="admin-table-empty" style={{ padding: '24px', textAlign: 'center' }}>No logins in this period.</td></tr>
                                )}
                                {stats.staffLogins?.map(log => (
                                    <tr key={log.LogID}>
                                        <td style={{ color: 'var(--adm-text-primary)', fontWeight: 500 }}>{log.FirstName} {log.LastName}</td>
                                        <td>
                                            {(() => { const c = roleColors[log.Role] || { bg: 'rgba(100,100,100,0.15)', color: '#888' }; return (
                                                <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: c.bg, color: c.color }}>
                                                    {log.Role}
                                                </span>
                                            ); })()}
                                        </td>
                                        <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem', textAlign: 'left' }}>{formatDate(log.LoginTime)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Panel>

                    <Panel title="Recent Public User Logins" count={stats.customerLogins?.length}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th style={{ textAlign: 'left' }}>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.customerLogins?.length === 0 && (
                                    <tr><td colSpan="3" className="admin-table-empty" style={{ padding: '24px', textAlign: 'center' }}>No logins in this period.</td></tr>
                                )}
                                {stats.customerLogins?.map(log => (
                                    <tr key={log.LogID}>
                                        <td style={{ color: 'var(--adm-text-primary)', fontWeight: 500 }}>{log.FullName}</td>
                                        <td style={{ color: 'var(--adm-text-secondary)' }}>{log.Email}</td>
                                        <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem', textAlign: 'left' }}>{formatDate(log.LoginTime)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Panel>
                </div>
            )}
        </div>
    );
};

export default LoginAnalytics;
