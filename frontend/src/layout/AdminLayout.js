import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, PawPrint, Map, Ticket, ShoppingBag, Wrench, MessageSquare, LogOut, TicketCheck, CalendarDays } from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <PawPrint size={28} className="admin-brand-icon" />
          <span className="admin-brand-text">WildHaven Admin</span>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/animals" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <PawPrint size={20} className="nav-icon" />
            <span>Animals</span>
          </NavLink>
          <NavLink to="/admin/exhibits" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <Map size={20} className="nav-icon" />
            <span>Exhibits</span>
          </NavLink>
          <NavLink to="/admin/attractions" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <TicketCheck size={20} className="nav-icon" />
            <span>Attractions</span>
          </NavLink>
          <NavLink to="/admin/events" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <CalendarDays size={20} className="nav-icon" />
            <span>Events</span>
          </NavLink>
          <NavLink to="/admin/tickets" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <Ticket size={20} className="nav-icon" />
            <span>Tickets</span>
          </NavLink>
          <NavLink to="/admin/shop" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <ShoppingBag size={20} className="nav-icon" />
            <span>Shop</span>
          </NavLink>
          <NavLink to="/admin/maintenance" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <Wrench size={20} className="nav-icon" />
            <span>Maintenance</span>
          </NavLink>
          <NavLink to="/admin/feedback" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <MessageSquare size={20} className="nav-icon" />
            <span>Feedback</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn">
            <LogOut size={20} className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
