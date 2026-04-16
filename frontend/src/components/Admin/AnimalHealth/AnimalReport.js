import React, { useState, useEffect, useCallback } from 'react';
import '../AdminTable.css';
import './AnimalReport.css';
import {
  ClipboardList, ChevronDown, ChevronRight, PawPrint, HeartPulse,
  UtensilsCrossed, Search, AlertTriangle, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import AdminSelect from '../AdminSelect';
import AdminDatePicker from '../AdminDatePicker';
import { getAnimalReport, getAnimalsForDropdown, getHealthReport } from '../../../services/animalHealthService';
import { exportSectionsToSingleSheet } from '../../../utils/exportExcel';

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
};

const scoreClass = (s) => {
  if (s >= 90) return 'ah-score-excellent';
  if (s >= 65) return 'ah-score-good';
  if (s >= 40) return 'ah-score-fair';
  return 'ah-score-critical';
};

const scoreLabel = (s) => {
  if (s >= 90) return 'Excellent';
  if (s >= 65) return 'Good';
  if (s >= 40) return 'Fair';
  return 'Critical';
};

const healthPriority = { Critical: 0, Poor: 1, Fair: 2, Good: 3, Excellent: 4 };

const healthColor = {
  Excellent: '#10b981',
  Good: '#3b82f6',
  Fair: '#f59e0b',
  Critical: '#ef4444',
  Poor: '#ef4444',
};

/* ── Collapsible section ─────────────────────────────── */
const Section = ({ icon, title, count, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ar-section">
      <div className="ar-section-header" onClick={() => setOpen(o => !o)}>
        {icon}
        <h3>{title}</h3>
        {count != null && <span className="ar-section-count">{count}</span>}
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </div>
      {open && <div className="ar-section-body">{children}</div>}
    </div>
  );
};

const closeModal = (setModalOpen, setReport, setSelectedAnimalId) => {
  setModalOpen(false);
  setReport(null);
  setSelectedAnimalId('');
};

const AnimalReport = () => {
  const [animals, setAnimals] = useState([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('custom');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const TODAY = getYMD(new Date());

  const { dateFrom, dateTo } = React.useMemo(() => {
    const now = new Date();
    const todayStr = getYMD(now);
    
    if (dateFilter === 'today') return { dateFrom: todayStr, dateTo: todayStr };
    if (dateFilter === 'week') {
      const s = new Date(now);
      s.setDate(s.getDate() - s.getDay());
      return { dateFrom: getYMD(s), dateTo: todayStr };
    }
    if (dateFilter === 'month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { dateFrom: getYMD(s), dateTo: todayStr };
    }
    if (dateFilter === 'custom') {
      return { dateFrom: customStart || '', dateTo: customEnd || '' };
    }
    return { dateFrom: '', dateTo: '' };
  }, [dateFilter, customStart, customEnd]);

  useEffect(() => {
    getAnimalsForDropdown()
      .then(data => setAnimals(data))
      .catch(() => { /* non-fatal */ });
  }, []);

  const loadReport = useCallback(async (id) => {
    if (!id) { setReport(null); return; }
    setLoading(true);
    try {
      const data = await getAnimalReport(id);
      setReport(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load animal report.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleViewReport = (animalId) => {
    setSelectedAnimalId(String(animalId));
    setModalOpen(true);
    loadReport(String(animalId));
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setReport(null);
    setSelectedAnimalId('');
  };

  const a = report?.animal;
  const modalAnimal = animals.find(an => String(an.AnimalID) === selectedAnimalId);

  const inDateRange = (dateStr) => {
    if (!dateFrom && !dateTo) return true;
    if (!dateStr) return false;
    const d = (dateStr.includes('T') ? dateStr.split('T')[0] : dateStr);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  const filteredHealthRecords = (report?.healthRecords?.filter(r => inDateRange(r.CheckupDate)) || [])
    .sort((a, b) => new Date(b.CheckupDate || 0) - new Date(a.CheckupDate || 0));
  const filteredAlerts = (report?.alerts?.filter(a => inDateRange(a.CreatedAt)) || [])
    .sort((a, b) => new Date(b.CreatedAt || 0) - new Date(a.CreatedAt || 0));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title"><ClipboardList size={26} className="title-icon" /> Animal Data Report</h1>
          <p className="admin-page-subtitle">Comprehensive report with all related data for a selected animal</p>
        </div>
        <button
          className="dr-details-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}
          disabled={animals.length === 0}
          onClick={async () => {
            try {
              toast.info('Preparing full animal report...');
              const healthData = await getHealthReport();
              const summaryRows = animals.map(a => ({
                'Animal ID': a.AnimalCode || '', 'Name': a.Name || '', 'Species': a.Species || '',
                'Exhibit': a.ExhibitName || '', 'Age': a.Age || '', 'Gender': a.Gender || '',
                'Health Status': a.HealthStatus || '',
              }));
              const recordRows = (healthData.records || []).filter(r => inDateRange(r.CheckupDate)).map(r => ({
                'Animal': r.AnimalName || '', 'Code': r.AnimalCode || '', 'Species': r.Species || '',
                'Checkup Date': r.CheckupDate ? new Date(r.CheckupDate).toLocaleDateString() : '',
                'Health Score': r.HealthScore ?? '', 'Staff': r.StaffName || '',
                'Weight': r.Weight ?? '', 'Activity Level': r.ActivityLevel || '',
                'Appetite': r.AppetiteStatus || '', 'Conditions': r.MedicalConditions || '',
                'Treatments': r.RecentTreatments || '', 'Notes': r.Notes || '',
              }));
              const feedingRows = (healthData.feedings || []).map(f => ({
                'Animal': f.AnimalName || '', 'Code': f.AnimalCode || '', 'Species': f.Species || '',
                'Food Type': f.FoodType || '', 'Quantity': f.Quantity ?? '',
                'Unit': f.Unit || '', 'Frequency': f.Frequency || '',
                'Time': f.FeedingTime || '', 'Instructions': f.SpecialInstructions || '',
              }));
              const alertRows = (healthData.alerts || []).filter(a => inDateRange(a.CreatedAt)).map(a => ({
                'Animal': a.AnimalName || '', 'Code': a.AnimalCode || '', 'Species': a.Species || '',
                'Alert Type': a.AlertType || '', 'Message': a.AlertMessage || '',
                'Date': a.CreatedAt ? new Date(a.CreatedAt).toLocaleDateString() : '',
                'Status': a.IsResolved ? 'Resolved' : 'Active',
              }));
              exportSectionsToSingleSheet([
                { name: 'Animals Summary', data: summaryRows },
                { name: 'Health Records', data: recordRows },
                { name: 'Feeding Schedules', data: feedingRows },
                { name: 'Health Alerts', data: alertRows },
              ], 'Animal_Report', { reportName: 'Animal Data Report', dateFrom, dateTo });
              toast.success('Animal report downloaded.');
            } catch (err) {
              toast.error('Failed to generate report.');
            }
          }}
        >
          <Download size={15} /> Download Excel
        </button>
      </div>

      {/* ── Search bar ── */}
      <div className="ar-toolbar">
        <div className="admin-search-container" style={{ maxWidth: 340, flex: 1, margin: 0 }}>
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by name, ID, or species..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Animal table ── */}
      <div className="admin-table-container">
        {animals.length === 0 ? (
          <div className="admin-table-empty">Loading animals...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Animal ID</th>
                <th>Name</th>
                <th>Animal Group</th>
                <th>Exhibit</th>
                <th>Age / Sex</th>
                <th>Health</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...animals]
                .filter(an => {
                  if (!search) return true;
                  const q = search.toLowerCase();
                  return (
                    (an.AnimalCode || '').toLowerCase().includes(q) ||
                    (an.Name || '').toLowerCase().includes(q) ||
                    (an.Species || '').toLowerCase().includes(q)
                  );
                })
                .sort((a, b) => (healthPriority[a.HealthStatus] ?? 99) - (healthPriority[b.HealthStatus] ?? 99))
                .map(an => {
                const hc = healthColor[an.HealthStatus] || '#6b7280';
                return (
                  <tr key={an.AnimalID}>
                    <td>
                      <span style={{ fontFamily: 'monospace', color: 'var(--adm-accent)', fontSize: '0.82rem' }}>
                        {an.AnimalCode || '—'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {an.Name || <span style={{ color: 'var(--adm-text-muted)', fontStyle: 'italic' }}>Unnamed</span>}
                    </td>
                    <td>{an.Species}</td>
                    <td style={{ color: 'var(--adm-text-secondary)' }}>
                      {an.ExhibitName || <span style={{ color: 'var(--adm-text-muted)', fontStyle: 'italic' }}>Unassigned</span>}
                    </td>
                    <td style={{ color: 'var(--adm-text-secondary)' }}>
                      {an.Age ? `${an.Age} yrs` : '—'}{an.Gender ? ` · ${an.Gender}` : ''}
                    </td>
                    <td>
                      {an.HealthStatus && (
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                          fontSize: '0.75rem', fontWeight: 600,
                          background: hc + '22', color: hc
                        }}>
                          {an.HealthStatus}
                        </span>
                      )}
                    </td>
                    <td>
                      <button className="dr-details-btn" onClick={() => handleViewReport(an.AnimalID)}>
                        View Report
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Report modal ── */}
      {modalOpen && (
        <div className="ar-modal-overlay" onClick={handleCloseModal}>
          <div className="ar-modal" onClick={e => e.stopPropagation()}>
            <div className="ar-modal-header">
              <div>
                <span className="ar-modal-title">
                  {a?.Name || modalAnimal?.Name || modalAnimal?.Species || 'Animal Report'}
                </span>
                <span className="ar-modal-sub">
                  {a?.AnimalCode || modalAnimal?.AnimalCode || ''}
                  {modalAnimal?.Species && a?.Name ? ` · ${modalAnimal.Species}` : ''}
                </span>
              </div>
              <button className="ar-modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <div className="ar-modal-body">
              {loading && <div className="admin-table-empty">Loading report...</div>}

              {!loading && !report && (
                <div className="admin-table-empty">No data found for this animal.</div>
              )}

              {!loading && report && a && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
                    {dateFilter === 'custom' && (
                      <>
                        <AdminDatePicker
                          value={customStart}
                          onChange={setCustomStart}
                          placeholder="Start date"
                          maxDate={customEnd || TODAY}
                        />
                        <span style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>to</span>
                        <AdminDatePicker
                          value={customEnd}
                          onChange={setCustomEnd}
                          placeholder="End date"
                          minDate={customStart || undefined}
                          maxDate={TODAY}
                        />
                      </>
                    )}
                    <AdminSelect
                      value={dateFilter}
                      onChange={v => { setDateFilter(v); setCustomStart(''); setCustomEnd(''); }}
                      width="148px"
                      options={[
                        { value: 'today', label: 'Today' },
                        { value: 'week', label: 'This Week' },
                        { value: 'month', label: 'This Month' },
                        { value: 'custom', label: 'Custom Range' },
                      ]}
                    />
                  </div>
                  <div className="ar-sections">
                  {/* ── Animal Profile ── */}
                  <Section icon={<PawPrint size={16} color="var(--adm-accent)" />} title="Animal Profile" defaultOpen={true}>
                    <div className="ar-profile">
                      <div className="ar-profile-item"><span className="ar-profile-label">Name</span><span className="ar-profile-value">{a.Name || '—'}</span></div>
                      <div className="ar-profile-item"><span className="ar-profile-label">Animal Group</span><span className="ar-profile-value">{a.Species}</span></div>
                      <div className="ar-profile-item"><span className="ar-profile-label">Age</span><span className="ar-profile-value">{a.Age} years</span></div>
                      <div className="ar-profile-item"><span className="ar-profile-label">Gender</span><span className="ar-profile-value">{a.Gender || '—'}</span></div>
                      <div className="ar-profile-item"><span className="ar-profile-label">Date Arrived</span><span className="ar-profile-value">{fmtDate(a.DateArrived)}</span></div>
                      <div className="ar-profile-item"><span className="ar-profile-label">Habitat</span><span className="ar-profile-value">{a.HabitatType || '—'}</span></div>
                      <div className="ar-profile-item"><span className="ar-profile-label">Exhibit</span><span className="ar-profile-value">{a.ExhibitName || '—'}</span></div>
                      <div className="ar-profile-item"><span className="ar-profile-label">Area</span><span className="ar-profile-value">{a.AreaName || '—'}</span></div>
                      {a.HealthStatus && <div className="ar-profile-item"><span className="ar-profile-label">Health Status</span><span className="ar-profile-value">{a.HealthStatus}</span></div>}
                      {a.Diet && <div className="ar-profile-item"><span className="ar-profile-label">Diet</span><span className="ar-profile-value">{a.Diet}</span></div>}
                      {a.Weight && <div className="ar-profile-item"><span className="ar-profile-label">Weight</span><span className="ar-profile-value">{a.Weight}</span></div>}
                      {a.Region && <div className="ar-profile-item"><span className="ar-profile-label">Region</span><span className="ar-profile-value">{a.Region}</span></div>}
                      {a.Lifespan && <div className="ar-profile-item"><span className="ar-profile-label">Lifespan</span><span className="ar-profile-value">{a.Lifespan}</span></div>}
                      {a.FunFact && <div className="ar-profile-item"><span className="ar-profile-label">Fun Fact</span><span className="ar-profile-value">{a.FunFact}</span></div>}
                      {a.IsEndangered != null && <div className="ar-profile-item"><span className="ar-profile-label">Endangered</span><span className="ar-profile-value">{a.IsEndangered ? 'Yes' : 'No'}</span></div>}
                    </div>
                  </Section>

                  {/* ── Health Records ── */}
                  <Section icon={<HeartPulse size={16} color="#ef4444" />} title="Health Records" count={filteredHealthRecords.length}>
                    {filteredHealthRecords.length === 0 ? (
                      <div className="ar-empty-section">No health records {dateFrom || dateTo ? 'in the selected date range.' : 'on file.'}</div>
                    ) : (
                      <table className="ar-mini-table">
                        <thead><tr><th>Date</th><th>Score</th><th>Weight</th><th>Activity</th><th>Appetite</th><th>Staff</th><th>Notes</th></tr></thead>
                        <tbody>
                          {filteredHealthRecords.map(r => (
                            <tr key={r.RecordID}>
                              <td>{fmtDate(r.CheckupDate)}</td>
                              <td><span className={`ah-score ${scoreClass(r.HealthScore)}`}><span className="ah-score-dot" />{r.HealthScore} — {scoreLabel(r.HealthScore)}</span></td>
                              <td>{r.Weight != null ? `${Number(r.Weight).toFixed(1)} kg` : '—'}</td>
                              <td>{r.ActivityLevel || '—'}</td>
                              <td>{r.AppetiteStatus || '—'}</td>
                              <td>{r.StaffName || '—'}</td>
                              <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.Notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Section>

                  {/* ── Health Alerts ── */}
                  <Section icon={<AlertTriangle size={16} color="#f59e0b" />} title="Health Alerts" count={filteredAlerts.length} defaultOpen={filteredAlerts.some(a => !a.IsResolved)}>
                    {filteredAlerts.length === 0 ? (
                      <div className="ar-empty-section">No health alerts {dateFrom || dateTo ? 'in the selected date range.' : '.'}</div>
                    ) : (
                      <table className="ar-mini-table">
                        <thead><tr><th>Date</th><th>Type</th><th>Message</th><th>Status</th></tr></thead>
                        <tbody>
                          {filteredAlerts.map(a => (
                            <tr key={a.AlertID}>
                              <td>{fmtDate(a.CreatedAt)}</td>
                              <td>{a.AlertType}</td>
                              <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.AlertMessage}</td>
                              <td>{a.IsResolved
                                ? <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}><CheckCircle size={13} style={{ verticalAlign: 'middle' }} /> Resolved</span>
                                : <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8rem' }}><AlertTriangle size={13} style={{ verticalAlign: 'middle' }} /> Active</span>
                              }</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Section>

                  {/* ── Feeding Schedules ── */}
                  <Section icon={<UtensilsCrossed size={16} color="#f59e0b" />} title="Feeding Schedules" count={report.feedings.length} defaultOpen={report.feedings.length > 0}>
                    {report.feedings.length === 0 ? (
                      <div className="ar-empty-section">No feeding schedules found.</div>
                    ) : (
                      <table className="ar-mini-table">
                        <thead><tr><th>Feed Time</th><th>Food Type</th><th>Assigned Staff</th></tr></thead>
                        <tbody>
                          {report.feedings.map(f => (
                            <tr key={f.ScheduleID}>
                              <td>{f.FeedTime ? new Date(f.FeedTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                              <td>{f.FoodType || '—'}</td>
                              <td>{f.StaffName || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Section>
                </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalReport;
