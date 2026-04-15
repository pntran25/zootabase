import React, { useEffect, useState } from 'react';
import {
  createMaintenanceRequest,
  getMaintenanceRequests,
} from '../../services/maintenanceService';

const fallbackRequests = [
  { id: 'M-501', area: 'Polar Tundra', issue: 'Cooling unit alert', priority: 'High', status: 'In Progress' },
  { id: 'M-502', area: 'Main Gate', issue: 'Turnstile sensor fault', priority: 'Medium', status: 'Open' },
];

const MaintenancePage = () => {
  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState({ area: '', issue: '', priority: 'Medium' });

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await getMaintenanceRequests();
        setRequests(Array.isArray(data) && data.length ? data : fallbackRequests);
      } catch (error) {
        setRequests(fallbackRequests);
      }
    };

    loadRequests();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const newRequest = {
      id: `M-${Math.floor(Math.random() * 900 + 100)}`,
      area: formData.area,
      issue: formData.issue,
      priority: formData.priority,
      status: 'Open',
    };

    try {
      await createMaintenanceRequest(formData);
      setRequests((prev) => [newRequest, ...prev]);
    } catch (error) {
      setRequests((prev) => [newRequest, ...prev]);
    }

    setFormData({ area: '', issue: '', priority: 'Medium' });
  };

  return (
    <main className="zoo-page">
      <h1 className="zoo-page-title">Maintenance Requesting</h1>
      <p className="zoo-page-subtitle">Create and track facility maintenance tickets for zoo operations.</p>

      <section className="zoo-card" style={{ marginBottom: 16 }}>
        <h3>New Request</h3>
        <form onSubmit={handleSubmit} className="zoo-grid">
          <label>
            Area
            <input
              value={formData.area}
              onChange={(event) => setFormData((prev) => ({ ...prev, area: event.target.value }))}
              required
              placeholder="e.g. Tropical Rainforest"
              style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1px solid #d7d0c2' }}
            />
          </label>

          <label>
            Issue
            <input
              value={formData.issue}
              onChange={(event) => setFormData((prev) => ({ ...prev, issue: event.target.value }))}
              required
              placeholder="Short issue summary"
              style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1px solid #d7d0c2' }}
            />
          </label>

          <label>
            Priority
            <select
              value={formData.priority}
              onChange={(event) => setFormData((prev) => ({ ...prev, priority: event.target.value }))}
              style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1px solid #d7d0c2' }}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </label>

          <div className="zoo-actions" style={{ alignItems: 'flex-end' }}>
            <button type="submit" className="zoo-btn">Submit Request</button>
          </div>
        </form>
      </section>

      <table className="zoo-table" aria-label="Maintenance requests table">
        <thead>
          <tr>
            <th>Area</th>
            <th>Issue</th>
            <th>Priority</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.area}</td>
              <td>{request.issue}</td>
              <td>{request.priority}</td>
              <td>{request.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};

export default MaintenancePage;
