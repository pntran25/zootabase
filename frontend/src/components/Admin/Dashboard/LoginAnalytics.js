import { useState, useEffect } from 'react';
import { LineChart } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../../services/apiClient';
import '../AdminTable.css';

const roleColors = {
  'Super Admin':       { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
  'Caretaker':         { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
  'Event Coordinator': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  'Ticket Staff':      { bg: 'rgba(234,179,8,0.15)',   color: '#ca8a04' },
  'Shop Manager':      { bg: 'rgba(249,115,22,0.15)',  color: '#ea580c' },
  'Maintenance':       { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
};

const LoginAnalytics = () => {
    const [stats, setStats] = useState({ staffLogins: [], customerLogins: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const { auth } = await import('../../../services/firebase');
                const token = await auth.currentUser.getIdToken();
                const res = await fetch(`${API_BASE_URL}/api/analytics/logins`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load login analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const formatDate = (d) => new Date(d).toLocaleString();

    const Panel = ({ title, children }) => (
        <div className="admin-table-container" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--adm-border)',
                background: 'var(--adm-bg-surface-2)',
                flexShrink: 0,
            }}>
                <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--adm-text-primary)' }}>{title}</h2>
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
            </div>

            {loading ? (
                <div className="admin-table-container"><div className="admin-table-loading">Loading analytics...</div></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, minHeight: 0 }}>
                    <Panel title="Recent Staff Logins">
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
                                    <tr><td colSpan="3" className="admin-table-empty" style={{ padding: '24px', textAlign: 'center' }}>No recent staff logins.</td></tr>
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

                    <Panel title="Recent Public User Logins">
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
                                    <tr><td colSpan="3" className="admin-table-empty" style={{ padding: '24px', textAlign: 'center' }}>No recent user logins.</td></tr>
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
