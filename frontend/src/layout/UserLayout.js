import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import './UserLayout.css';
import Footer from './Footer';
import brandLogo from '../assets/images/Logo.png';

const UserIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: '1rem', height: '1rem' }}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const TicketIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: '1rem', height: '1rem' }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;
const MenuIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: '1.5rem', height: '1.5rem' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const XIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: '1.5rem', height: '1.5rem' }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

const UserLayout = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="ww-user-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="ww-header">
        <div className="ww-header-container">
          <NavLink to="/" className="ww-header-brand">
            <img src={brandLogo} alt="WildWoods Logo" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
            <span className="ww-logo-text">Wildwood Zoo</span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="ww-header-nav" aria-label="Main navigation">
            <NavLink to="/" end className={({ isActive }) => `ww-nav-link ${isActive ? 'active' : ''}`}>
              Home
            </NavLink>
            <NavLink to="/exhibits" className={({ isActive }) => `ww-nav-link ${isActive ? 'active' : ''}`}>Exhibits</NavLink>
            <NavLink to="/attractions" className={({ isActive }) => `ww-nav-link ${isActive ? 'active' : ''}`}>Attractions</NavLink>
            <NavLink to="/animals" className={({ isActive }) => `ww-nav-link ${isActive ? 'active' : ''}`}>Animals</NavLink>
            <NavLink to="/events" className={({ isActive }) => `ww-nav-link ${isActive ? 'active' : ''}`}>Events</NavLink>
            <NavLink to="/products" className={({ isActive }) => `ww-nav-link ${isActive ? 'active' : ''}`}>Gift Shop</NavLink>
          </nav>

          <div className="ww-header-actions">
            <NavLink to="/login" className="ww-btn-login"><UserIcon /> Login</NavLink>
            <NavLink to="/ticketing" className="ww-btn-tickets"><TicketIcon /> Buy Tickets</NavLink>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="ww-mobile-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      <main className="ww-main-content" style={{ flex: 1 }}>
        <Outlet />
      </main>

      <Footer />
      <Toaster richColors position="top-center" />
    </div>
  );
};

export default UserLayout;
