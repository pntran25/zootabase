import React, { useState, useEffect, useCallback } from 'react';
import '../AdminTable.css';
import './AnimalReport.css';
import {
  ClipboardList, ChevronDown, ChevronRight, PawPrint, HeartPulse,
  Scale, Users, UtensilsCrossed, AlertTriangle, CheckCircle, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { getAnimalReport, getAnimalsForDropdown } from '../../../services/animalHealthService';

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
};

const scoreClass = (s) => {
  if (s >= 80) return 'ah-score-excellent';
  if (s >= 60) return 'ah-score-good';
  if (s >= 40) return 'ah-score-fair';
  return 'ah-score-critical';
};

const scoreLabel = (s) => {
  if (s >= 80) return 'Excellent';
  if (s >= 60) return 'Good';
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

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title"><ClipboardList size={26} className="title-icon" /> Animal Data Report</h1>
          <p className="admin-page-subtitle">Comprehensive report with all related data for a selected animal</p>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div style={{ marginBottom: 14, position: 'relative', maxWidth: 340 }}>
        <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-text-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Search by name, ID, or species..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px 8px 34px',
            background: 'var(--adm-bg-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 8,
            color: 'var(--adm-text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
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
                  <Section icon={<HeartPulse size={16} color="#ef4444" />} title="Health Records" count={report.healthRecords.length}>
                    {report.healthRecords.length === 0 ? (
                      <div className="ar-empty-section">No health records on file.</div>
                    ) : (
                      <table className="ar-mini-table">
                        <thead><tr><th>Date</th><th>Score</th><th>Staff</th><th>Notes</th></tr></thead>
                        <tbody>
                          {report.healthRecords.map(r => (
                            <tr key={r.RecordID}>
                              <td>{fmtDate(r.CheckupDate)}</td>
                              <td><span className={`ah-score ${scoreClass(r.HealthScore)}`}><span className="ah-score-dot" />{r.HealthScore} — {scoreLabel(r.HealthScore)}</span></td>
                              <td>{r.StaffName || '—'}</td>
                              <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.Notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Section>

                  {/* ── Health Metrics ── */}
                  <Section icon={<Scale size={16} color="#0ea5e9" />} title="Health Metrics" count={report.healthMetrics.length}>
                    {report.healthMetrics.length === 0 ? (
                      <div className="ar-empty-section">No health metrics recorded.</div>
                    ) : (
                      <table className="ar-mini-table">
                        <thead><tr><th>Date</th><th>Weight</th><th>Range</th><th>Activity</th><th>Appetite</th><th>Conditions</th><th>Treatments</th></tr></thead>
                        <tbody>
                          {report.healthMetrics.map(m => {
                            const w = m.Weight;
                            const lo = m.WeightRangeLow;
                            const hi = m.WeightRangeHigh;
                            const outOfRange = w && ((lo && w < lo) || (hi && w > hi));
                            return (
                              <tr key={m.MetricID}>
                                <td>{fmtDate(m.RecordDate)}</td>
                                <td style={{ color: outOfRange ? '#ef4444' : 'inherit', fontWeight: outOfRange ? 700 : 'inherit' }}>
                                  {w != null ? `${Number(w).toFixed(1)} kg` : '—'}
                                  {outOfRange && ' ⚠'}
                                </td>
                                <td style={{ fontSize: '0.8rem', color: 'var(--adm-text-secondary)' }}>
                                  {lo || hi ? `${lo ? Number(lo).toFixed(0) : '?'} – ${hi ? Number(hi).toFixed(0) : '?'} kg` : '—'}
                                </td>
                                <td>{m.ActivityLevel || '—'}</td>
                                <td>{m.AppetiteStatus || '—'}</td>
                                <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.MedicalConditions || '—'}</td>
                                <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.RecentTreatments || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </Section>

                  {/* ── Keeper Assignments ── */}
                  <Section icon={<Users size={16} color="#8b5cf6" />} title="Keeper Assignments" count={report.keepers.length}>
                    {report.keepers.length === 0 ? (
                      <div className="ar-empty-section">No keeper assignments found.</div>
                    ) : (
                      <table className="ar-mini-table">
                        <thead><tr><th>Keeper</th><th>Role</th><th>Start Date</th><th>End Date</th></tr></thead>
                        <tbody>
                          {report.keepers.map(k => (
                            <tr key={k.AssignmentID}>
                              <td style={{ fontWeight: 600 }}>{k.KeeperName}</td>
                              <td>{k.Role}</td>
                              <td>{fmtDate(k.StartDate)}</td>
                              <td>{k.EndDate ? fmtDate(k.EndDate) : <span style={{ color: '#16a34a', fontWeight: 600 }}>Active</span>}</td>
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

                  {/* ── Health Alerts ── */}
                  <Section icon={<AlertTriangle size={16} color="#ef4444" />} title="Health Alerts" count={report.alerts.length} defaultOpen={report.alerts.length > 0}>
                    {report.alerts.length === 0 ? (
                      <div className="ar-empty-section">No alerts triggered for this animal.</div>
                    ) : (
                      <table className="ar-mini-table">
                        <thead><tr><th>Type</th><th>Message</th><th>Date</th><th>Status</th></tr></thead>
                        <tbody>
                          {report.alerts.map(al => (
                            <tr key={al.AlertID}>
                              <td style={{ fontWeight: 600 }}>{al.AlertType}</td>
                              <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{al.AlertMessage}</td>
                              <td>{fmtDate(al.CreatedAt)}</td>
                              <td>
                                {al.IsResolved
                                  ? <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={13} /> Resolved</span>
                                  : <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={13} /> Active</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalReport;
