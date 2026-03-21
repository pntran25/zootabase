import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PawPrint, Map, Ticket, ShoppingBag,
  Wrench, MessageSquare, LogOut, TicketCheck, CalendarDays,
  Sun, Moon
} from 'lucide-react';
import brandLogo from '../assets/images/Logo.png';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import './AdminLayout.css';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(
    () => localStorage.getItem('admin-theme') || 'light'
  );
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    const check = () => {
      fetch(`${API}/health`, { signal: AbortSignal.timeout(4000) })
        .then(r => setIsConnected(r.ok))
        .catch(() => setIsConnected(false));
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('admin-theme', next);
  };

  return (
    <div className="admin-layout" data-theme={theme}>
      <Toaster position="top-right" richColors closeButton />

      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        {/* Brand */}
        <div className="admin-brand">
          <img src={brandLogo} alt="WildWoods Logo" className="admin-brand-logo" />
          <span className="admin-brand-text">WildWoods</span>
        </div>

        <div className="admin-sidebar-divider" />

        {/* Profile Card */}
        <div className="admin-sidebar-profile">
          <div className="sidebar-profile-avatar">A</div>
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">Administrator</span>
            <span className="sidebar-profile-status">
              <span className="sidebar-status-dot" style={{ background: isConnected ? '#10b981' : '#ef4444' }} />
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="admin-sidebar-divider" />

        {/* Nav */}
        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={18} className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/animals" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <PawPrint size={18} className="nav-icon" />
            <span>Animals</span>
          </NavLink>
          <NavLink to="/admin/exhibits" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <Map size={18} className="nav-icon" />
            <span>Exhibits</span>
          </NavLink>
          <NavLink to="/admin/attractions" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <TicketCheck size={18} className="nav-icon" />
            <span>Attractions</span>
          </NavLink>
          <NavLink to="/admin/events" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <CalendarDays size={18} className="nav-icon" />
            <span>Events</span>
          </NavLink>
          <NavLink to="/admin/tickets" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <Ticket size={18} className="nav-icon" />
            <span>Tickets</span>
          </NavLink>
          <NavLink to="/admin/shop" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <ShoppingBag size={18} className="nav-icon" />
            <span>Shop</span>
          </NavLink>

          <p className="admin-nav-section-label">System</p>

          <NavLink to="/admin/maintenance" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <Wrench size={18} className="nav-icon" />
            <span>Maintenance</span>
          </NavLink>
          <NavLink to="/admin/feedback" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <MessageSquare size={18} className="nav-icon" />
            <span>Feedback</span>
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={() => navigate('/')}>
            <LogOut size={18} className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Content Wrapper ── */}
      <div className="admin-content-wrapper">
        {/* Top Bar */}
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <span className="admin-topbar-breadcrumb">
              WildWoods <span>Admin Portal</span>
            </span>
          </div>
          <div className="admin-topbar-right">
            <button
              className="admin-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <div className="admin-topbar-divider" />
            <div className="admin-topbar-user">
              <div className="admin-topbar-avatar">A</div>
              <span className="admin-topbar-username">Admin</span>
            </div>
          </div>
        </div>

        {/* Animated Page Content */}
        <main className="admin-main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
