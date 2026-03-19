import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { User } from 'lucide-react';
import './UserLayout.css';
import Footer from './Footer';

const UserLayout = () => (
  <div className="ww-user-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <header className="ww-header">
    <NavLink to="/" className="ww-header-brand">
      <span className="ww-logo-icon">W</span>
      <span className="ww-logo-text">WildWoods</span>
    </NavLink>

    <nav className="ww-header-nav" aria-label="Main navigation">
      <NavLink to="/" end className={({ isActive }) => `ww-nav-link ${isActive ? 'active' : ''}`}>
        Home
      </NavLink>
      <NavLink to="/exhibits" className={({ isActive }) => (isActive ? 'ww-nav-link active' : 'ww-nav-link')}>Exhibits</NavLink>
      <NavLink to="/animals" className={({ isActive }) => (isActive ? 'ww-nav-link active' : 'ww-nav-link')}>Animals</NavLink>
      <NavLink to="/events" className={({ isActive }) => (isActive ? 'ww-nav-link active' : 'ww-nav-link')}>Events</NavLink>
      <NavLink to="/products" className={({ isActive }) => `ww-nav-link ${isActive ? 'active' : ''}`}>
        Gift Shop
      </NavLink>
    </nav>

      <div className="ww-header-actions">
        <NavLink to="/login" className="ww-btn-login"><User size={15} /> Login</NavLink>
        <NavLink to="/ticketing" className="ww-btn-tickets">🎟 Buy Tickets</NavLink>
      </div>
    </header>

    <main className="ww-main-content" style={{ flex: 1 }}>
      <Outlet />
    </main>

    <Footer />
  </div>
);

export default UserLayout;
