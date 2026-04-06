import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PawPrint, Map, Ticket, ShoppingBag,
  Wrench, LogOut, TicketCheck, CalendarDays,
  Sun, Moon, Users, LineChart, FileText, HeartPulse, ClipboardList, CreditCard, UtensilsCrossed,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import brandLogo from '../assets/images/Logo.png';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebase';
import { API_BASE_URL } from '../services/apiClient';
import './AdminLayout.css';

const rolePermissions = {
  'Super Admin':       ['dashboard', 'animals', 'exhibits', 'attractions', 'events', 'tickets', 'shop', 'maintenance', 'staff', 'analytics', 'feedback', 'reports', 'memberships', 'animal-health', 'animal-care', 'animal-report', 'health-report'],
  'Zoo Manager':       ['dashboard', 'animals', 'exhibits', 'attractions', 'events', 'maintenance', 'animal-health', 'animal-care', 'animal-report', 'reports', 'analytics', 'feedback'],
  'Caretaker':         ['dashboard', 'animals', 'maintenance', 'animal-health', 'animal-care', 'animal-report', 'health-report'],
  'Event Coordinator': ['dashboard', 'events', 'reports', 'maintenance'],
  'Ticket Staff':      ['dashboard', 'tickets', 'memberships', 'reports', 'maintenance'],
  'Shop Manager':      ['dashboard', 'shop', 'reports', 'maintenance'],
  'Maintenance':       ['dashboard', 'maintenance'],
};

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const role = userProfile?.Role || 'Viewer';
  const myPerms = rolePermissions[role] || [];

  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [theme, setTheme] = useState(
    () => localStorage.getItem('admin-theme') || 'light'
  );
  const [isConnected, setIsConnected] = useState(false);

  const closeSidebarOnMobile = () => { if (window.innerWidth < 1024) setSidebarOpen(false); };

  useEffect(() => {
    const API = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
    const check = () => {
      fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(4000) })
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

  const handleLogout = async () => {
    navigate('/');
    try {
      if (auth.currentUser) await auth.signOut();
    } catch (e) {
      console.error(e);
    }
  };

  const hasAny = (...ids) => ids.some(id => myPerms.includes(id));

  const renderLink = (to, icon, label, id) => {
    if (!myPerms.includes(id)) return null;
    return (
      <NavLink
        to={to}
        end={to === '/admin'}
        className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
        onClick={closeSidebarOnMobile}
      >
        {icon}
        <span>{label}</span>
      </NavLink>
    );
  };


  return (
    <div className="admin-layout" data-theme={theme}>
      <Toaster position="top-right" richColors closeButton />

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
        {/* Brand */}
        <div className="admin-brand">
          <img src={brandLogo} alt="Zootabase Zoo Logo" className="admin-brand-logo" />
          <span className="admin-brand-text">Zootabase Zoo</span>
        </div>

        <div className="admin-sidebar-divider" />

        {/* Profile Card */}
        <div className="admin-sidebar-profile">
          <div className="sidebar-profile-avatar">{userProfile?.FirstName?.charAt(0) || 'A'}</div>
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">{userProfile?.FirstName || 'Administrator'}</span>
            <span className="sidebar-profile-status">
              <span className="sidebar-status-dot" style={{ background: isConnected ? '#10b981' : '#ef4444' }} />
              {role}
            </span>
          </div>
        </div>

        <div className="admin-sidebar-divider" />

        {/* Nav */}
        <nav className="admin-nav mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {renderLink('/admin', <LayoutDashboard size={18} className="nav-icon" />, 'Dashboard', 'dashboard')}

          {hasAny('animals', 'exhibits', 'attractions', 'events') && <p className="admin-nav-section-label mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Zoo</p>}
          {renderLink('/admin/animals', <PawPrint size={18} className="nav-icon" />, 'Animals', 'animals')}
          {renderLink('/admin/exhibits', <Map size={18} className="nav-icon" />, 'Exhibits', 'exhibits')}
          {renderLink('/admin/attractions', <TicketCheck size={18} className="nav-icon" />, 'Attractions', 'attractions')}
          {renderLink('/admin/events', <CalendarDays size={18} className="nav-icon" />, 'Events', 'events')}

          {hasAny('tickets', 'shop', 'memberships') && <p className="admin-nav-section-label mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Guest Services</p>}
          {renderLink('/admin/tickets', <Ticket size={18} className="nav-icon" />, 'Tickets', 'tickets')}
          {renderLink('/admin/shop', <ShoppingBag size={18} className="nav-icon" />, 'Shop', 'shop')}
          {renderLink('/admin/memberships', <CreditCard size={18} className="nav-icon" />, 'Manage Plans', 'memberships')}

          {hasAny('animal-health', 'animal-care') && <p className="admin-nav-section-label mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Animal Care</p>}
          {renderLink('/admin/animal-health', <HeartPulse size={18} className="nav-icon" />, 'Health Tracking', 'animal-health')}
          {renderLink('/admin/animal-care', <UtensilsCrossed size={18} className="nav-icon" />, 'Feeding & Keepers', 'animal-care')}

          {hasAny('animal-report', 'health-report', 'reports', 'analytics') && <p className="admin-nav-section-label mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Reports & Analytics</p>}
          {renderLink('/admin/animal-report', <ClipboardList size={18} className="nav-icon" />, 'Animal Reports', 'animal-report')}
          {renderLink('/admin/health-report', <HeartPulse size={18} className="nav-icon" />, 'Health Reports', 'health-report')}
          {renderLink('/admin/reports', <FileText size={18} className="nav-icon" />, 'Transaction Reports', 'reports')}
          {renderLink('/admin/analytics', <LineChart size={18} className="nav-icon" />, 'Analytics', 'analytics')}

          {hasAny('staff', 'maintenance') && <p className="admin-nav-section-label mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Administration</p>}
          {renderLink('/admin/staff', <Users size={18} className="nav-icon" />, 'Staff Management', 'staff')}
          {renderLink('/admin/maintenance', <Wrench size={18} className="nav-icon" />, 'Maintenance', 'maintenance')}
        </nav>

        {/* Footer */}
        <div className="admin-sidebar-footer mt-auto">
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={18} className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Sidebar Toggle Tab ── */}
      <button
        className="admin-sidebar-toggle"
        style={{ left: sidebarOpen ? 'var(--adm-sidebar-width)' : 0 }}
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* ── Mobile Backdrop ── */}
      {sidebarOpen && (
        <div className="admin-mobile-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Content Wrapper ── */}
      <div className="admin-content-wrapper">
        {/* Top Bar */}
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <span className="admin-topbar-breadcrumb">
              Zootabase Zoo <span>Admin Portal</span>
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
