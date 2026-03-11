import React from 'react';
import './Dashboard.css';
import { PawPrint, Ticket, Wrench, AlertCircle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard Overview</h1>
        <p className="admin-page-subtitle">Welcome to the WildHaven Admin Portal.</p>
      </div>

      {/* KPI Stats Row */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper green">
              <PawPrint size={24} />
            </div>
            <span className="stat-badge positive">+2 This Month</span>
          </div>
          <p className="stat-label">Total Animals</p>
          <h2 className="stat-value">12</h2>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper blue">
              <Ticket size={24} />
            </div>
            <span className="stat-badge positive">+12% vs Last Week</span>
          </div>
          <p className="stat-label">Tickets Sold (Today)</p>
          <h2 className="stat-value">482</h2>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper orange">
              <Wrench size={24} />
            </div>
            <span className="stat-badge warning">Requires Attention</span>
          </div>
          <p className="stat-label">Open Maint. Requests</p>
          <h2 className="stat-value">2</h2>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper purple">
              <AlertCircle size={24} />
            </div>
            <span className="stat-label-small">/ 5.0</span>
          </div>
          <p className="stat-label">Average Satisfaction</p>
          <h2 className="stat-value">4.0</h2>
        </div>
      </div>

      <div className="dashboard-content-grid">
        {/* Visitor Chart Mock */}
        <div className="dashboard-panel chart-panel">
          <div className="panel-header-flex">
            <div>
              <h3 className="panel-title">Visitor Attendance</h3>
              <p className="panel-subtitle">Mock attendance data for the trailing 7 days</p>
            </div>
            <span className="trend-badge"><TrendingUp size={14}/> +5.2%</span>
          </div>
          
          <div className="mock-bar-chart">
            {/* Simple CSS bars to simulate the chart */}
            <div className="bar-wrapper"><div className="bar" style={{height: '60%'}}></div><span className="bar-label">Mon</span></div>
            <div className="bar-wrapper"><div className="bar" style={{height: '75%'}}></div><span className="bar-label">Tue</span></div>
            <div className="bar-wrapper"><div className="bar" style={{height: '55%'}}></div><span className="bar-label">Wed</span></div>
            <div className="bar-wrapper"><div className="bar" style={{height: '68%'}}></div><span className="bar-label">Thu</span></div>
            <div className="bar-wrapper"><div className="bar" style={{height: '90%'}}></div><span className="bar-label">Fri</span></div>
            <div className="bar-wrapper"><div className="bar" style={{height: '95%'}}></div><span className="bar-label">Sat</span></div>
            <div className="bar-wrapper"><div className="bar" style={{height: '85%'}}></div><span className="bar-label">Sun</span></div>
          </div>
        </div>

        {/* Feedback Mock */}
        <div className="dashboard-panel feedback-panel">
          <h3 className="panel-title">Recent Feedback</h3>
          <p className="panel-subtitle">Latest surveys from park guests.</p>

          <div className="feedback-item">
            <div className="feedback-header">
              <span className="stars">★★★★☆</span>
              <span className="feedback-date">3/8/2026</span>
            </div>
            <p className="feedback-text">"Loved the penguins, but it was too crowded."</p>
            <div className="feedback-tag">Penguin Coast</div>
          </div>

          <div className="feedback-divider"></div>

          <div className="feedback-item">
            <div className="feedback-header">
              <span className="stars">★★★★★</span>
              <span className="feedback-date">3/10/2026</span>
            </div>
            <p className="feedback-text">"The giraffe feeding was the best part of our day!"</p>
            <div className="feedback-tag">African Savanna</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
